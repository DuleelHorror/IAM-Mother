Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\p\IAM Mother"
WshShell.Run "cmd /c npm run dev", 0, False
