# Fix PowerShell Execution Policy Error

## Problem

When running `npm run dev` or other npm commands, you get this error:

```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running 
scripts is disabled on this system.
```

## Solution

### Option 1: Set Execution Policy (Recommended)

Run this command in PowerShell **as Administrator**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Or for just the current session (temporary):

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

### Option 2: Use Command Prompt Instead

Instead of PowerShell, use Command Prompt (cmd.exe):

```cmd
cd C:\Users\user\KOVARI
npm run dev
```

### Option 3: Bypass for Single Command

Run npm with bypass flag:

```powershell
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

## Execution Policy Levels

- **Restricted**: No scripts can run (default on some systems)
- **RemoteSigned**: Local scripts run, downloaded scripts need signature
- **Unrestricted**: All scripts run (less secure)
- **Bypass**: No restrictions (use with caution)

## Recommended Setting

**RemoteSigned** is recommended because:
- ✅ Allows local scripts (like npm) to run
- ✅ Requires downloaded scripts to be signed (more secure)
- ✅ Only affects current user (not system-wide)

## Verify Fix

After setting the policy, verify it worked:

```powershell
Get-ExecutionPolicy -List
```

You should see `CurrentUser` set to `RemoteSigned`.

## Alternative: Use Command Prompt

If you prefer not to change PowerShell settings, just use Command Prompt (cmd.exe) instead of PowerShell for npm commands.
