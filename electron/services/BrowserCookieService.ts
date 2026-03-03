import { session } from 'electron'
import { execSync } from 'child_process'
import { readFileSync, copyFileSync, unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import crypto from 'crypto'

interface BrowserProfile {
  name: string
  userDataDir: string
}

interface RawCookie {
  host_key: string
  name: string
  path: string
  encrypted_value: Uint8Array
  expires_utc: number
  is_secure: number
  is_httponly: number
  samesite: number
}

/**
 * Reads and decrypts cookies from Chrome/Edge on Windows.
 * Uses DPAPI (via PowerShell) + AES-256-GCM (via Node crypto).
 */
export class BrowserCookieService {
  private static readonly BROWSERS: BrowserProfile[] = [
    {
      name: 'Chrome',
      userDataDir: path.join(
        process.env.LOCALAPPDATA || '',
        'Google', 'Chrome', 'User Data'
      )
    },
    {
      name: 'Edge',
      userDataDir: path.join(
        process.env.LOCALAPPDATA || '',
        'Microsoft', 'Edge', 'User Data'
      )
    }
  ]

  /**
   * Import cookies from the user's browser into an Electron session.
   * Returns number of cookies imported.
   */
  static async importCookies(
    targetSession: Electron.Session,
    domain: string
  ): Promise<{ imported: number; browser: string }> {
    // Find available browser
    const browser = this.findBrowser()
    if (!browser) {
      throw new Error('No se encontro Chrome ni Edge instalado')
    }

    // Get the decryption key
    const masterKey = this.getMasterKey(browser.userDataDir)

    // Read cookies from database
    const rawCookies = await this.readCookies(browser.userDataDir, domain)

    // Decrypt and import each cookie
    let imported = 0
    for (const raw of rawCookies) {
      try {
        const value = this.decryptCookieValue(raw.encrypted_value, masterKey)
        if (!value) continue

        // Convert Chrome's expires_utc (microseconds since 1601-01-01) to seconds since epoch
        // Chrome epoch: Jan 1, 1601. Unix epoch: Jan 1, 1970. Difference: 11644473600 seconds.
        let expirationDate: number | undefined
        if (raw.expires_utc > 0) {
          expirationDate = (raw.expires_utc / 1000000) - 11644473600
        }

        const sameSiteMap: Record<number, 'unspecified' | 'no_restriction' | 'lax' | 'strict'> = {
          [-1]: 'unspecified',
          0: 'no_restriction',
          1: 'lax',
          2: 'strict'
        }

        await targetSession.cookies.set({
          url: `${raw.is_secure ? 'https' : 'http'}://${raw.host_key.replace(/^\./, '')}${raw.path}`,
          name: raw.name,
          value,
          domain: raw.host_key,
          path: raw.path,
          secure: raw.is_secure === 1,
          httpOnly: raw.is_httponly === 1,
          sameSite: sameSiteMap[raw.samesite] || 'unspecified',
          expirationDate
        })
        imported++
      } catch {
        // Skip cookies that fail to decrypt or import
      }
    }

    return { imported, browser: browser.name }
  }

  /**
   * Get list of available browsers.
   */
  static getAvailableBrowsers(): string[] {
    return this.BROWSERS
      .filter(b => existsSync(path.join(b.userDataDir, 'Local State')))
      .map(b => b.name)
  }

  private static findBrowser(): BrowserProfile | null {
    for (const browser of this.BROWSERS) {
      const localState = path.join(browser.userDataDir, 'Local State')
      if (existsSync(localState)) {
        return browser
      }
    }
    return null
  }

  /**
   * Read the master encryption key from Chrome/Edge's Local State file.
   * Uses DPAPI via PowerShell to decrypt.
   */
  private static getMasterKey(userDataDir: string): Buffer {
    const localStatePath = path.join(userDataDir, 'Local State')
    const localState = JSON.parse(readFileSync(localStatePath, 'utf8'))
    const encryptedKeyB64 = localState.os_crypt?.encrypted_key

    if (!encryptedKeyB64) {
      throw new Error('No se encontro la clave de cifrado en Local State')
    }

    // Base64 decode, remove "DPAPI" prefix (first 5 bytes)
    const encryptedKey = Buffer.from(encryptedKeyB64, 'base64').subarray(5)
    const encKeyB64 = encryptedKey.toString('base64')

    // Use PowerShell + DPAPI to decrypt
    const psScript = `
      Add-Type -AssemblyName System.Security
      $encrypted = [Convert]::FromBase64String('${encKeyB64}')
      $decrypted = [System.Security.Cryptography.ProtectedData]::Unprotect(
        $encrypted, $null,
        [System.Security.Cryptography.DataProtectionScope]::CurrentUser
      )
      [Convert]::ToBase64String($decrypted)
    `.replace(/\n/g, ' ')

    const result = execSync(
      `powershell -NoProfile -NonInteractive -Command "${psScript}"`,
      { encoding: 'utf8', timeout: 10000 }
    ).trim()

    return Buffer.from(result, 'base64')
  }

  /**
   * Read cookies from the browser's SQLite database for a given domain.
   */
  private static async readCookies(
    userDataDir: string,
    domain: string
  ): Promise<RawCookie[]> {
    const cookiesPath = path.join(userDataDir, 'Default', 'Network', 'Cookies')
    if (!existsSync(cookiesPath)) {
      throw new Error('No se encontro la base de datos de cookies')
    }

    // Copy to temp to avoid lock conflicts with running browser
    const tempPath = path.join(tmpdir(), `iam-mother-cookies-${Date.now()}.db`)
    copyFileSync(cookiesPath, tempPath)

    try {
      // Dynamic import of sql.js
      const initSqlJs = require('sql.js')
      const SQL = await initSqlJs()
      const buf = readFileSync(tempPath)
      const db = new SQL.Database(buf)

      // Clean domain for query (handle .domain.com and domain.com)
      const cleanDomain = domain.replace(/^\./, '').replace(/^www\./, '')
      const stmt = db.prepare(
        `SELECT host_key, name, path, encrypted_value, expires_utc,
                is_secure, is_httponly, samesite
         FROM cookies
         WHERE host_key LIKE ? OR host_key LIKE ?`
      )
      stmt.bind([`%${cleanDomain}`, `%.${cleanDomain}`])

      const cookies: RawCookie[] = []
      while (stmt.step()) {
        const row = stmt.get()
        cookies.push({
          host_key: row[0] as string,
          name: row[1] as string,
          path: row[2] as string,
          encrypted_value: row[3] as Uint8Array,
          expires_utc: row[4] as number,
          is_secure: row[5] as number,
          is_httponly: row[6] as number,
          samesite: row[7] as number
        })
      }

      stmt.free()
      db.close()
      return cookies
    } finally {
      try { unlinkSync(tempPath) } catch { /* ignore */ }
    }
  }

  /**
   * Decrypt a Chrome cookie value using AES-256-GCM.
   * Format: v10/v20 prefix (3 bytes) + nonce (12 bytes) + ciphertext + auth tag (16 bytes)
   */
  private static decryptCookieValue(
    encrypted: Uint8Array,
    masterKey: Buffer
  ): string | null {
    if (!encrypted || encrypted.length < 31) return null

    const buf = Buffer.from(encrypted)

    // Check for v10/v20 prefix
    const prefix = buf.subarray(0, 3).toString('utf8')
    if (prefix !== 'v10' && prefix !== 'v20') {
      // Might be unencrypted or DPAPI-only (old format)
      return null
    }

    const nonce = buf.subarray(3, 15) // 12 bytes
    const ciphertextWithTag = buf.subarray(15)
    const authTag = ciphertextWithTag.subarray(ciphertextWithTag.length - 16)
    const ciphertext = ciphertextWithTag.subarray(0, ciphertextWithTag.length - 16)

    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, nonce)
      decipher.setAuthTag(authTag)
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ])
      return decrypted.toString('utf8')
    } catch {
      return null
    }
  }
}
