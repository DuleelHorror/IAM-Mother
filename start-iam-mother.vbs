Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\IAM Mother"
WshShell.Run "cmd /c nvm use 22.12.0 && npm run dev", 0, False
