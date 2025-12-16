# Connect Git Repository to Vercel Project

## Step-by-Step Guide

### Option 1: Connect via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/navneet31/kovari-admin
   - Or navigate to your project

2. **Go to Settings → Git**
   - Click on "Settings" in the top navigation
   - Select "Git" from the left sidebar

3. **Connect Repository**
   - Click "Connect Git Repository" button
   - You'll see a list of your GitHub repositories
   - Search for and select: `KOVARI` (or `NavneetPrajapati31/KOVARI`)
   - Click "Connect"

4. **Configure Git Settings**
   - **Production Branch**: Select `feature/admin-dashboard`
   - **Root Directory**: Should be `apps/admin` (verify this is set)
   - **Framework Preset**: Next.js (should auto-detect)
   - **Build Command**: Leave empty (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

5. **Save Settings**

### Option 2: Recreate Project with Git (If Option 1 doesn't work)

If you can't connect to existing project:

1. **Delete Current Project** (optional - only if needed)
   - Settings → General → Scroll down → "Delete Project"

2. **Create New Project from Git**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select `KOVARI` repository
   - **Configure:**
     - Project Name: `kovari-admin`
     - Framework: Next.js
     - Root Directory: `apps/admin` ⚠️ **IMPORTANT**
     - Branch: `feature/admin-dashboard`
   - Click "Deploy"

### Option 3: Use Vercel CLI to Link

```powershell
cd C:\Users\navne\CSE\DEV\KOVARI\apps\admin

# Link to existing project
vercel link

# When prompted:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? Yes
# - What’s the name of your existing project? kovari-admin
# - In which directory is your code located? apps/admin
```

## After Connecting

### Verify Connection

1. **Check Git Integration**
   - Go to Settings → Git
   - You should see your repository connected
   - Production branch should show: `feature/admin-dashboard`

2. **Test Auto-Deploy**
   - Make a small change (e.g., update a comment)
   - Commit and push:
     ```powershell
     git add .
     git commit -m "test: verify auto-deploy"
     git push origin feature/admin-dashboard
     ```
   - Go to Vercel Dashboard → Deployments
   - You should see a new deployment triggered automatically

### Configure Branch Protection (Optional)

If you want to require PRs for production:

1. Go to Settings → Git
2. Under "Production Branch Protection"
3. Enable "Require Pull Request for Production Deployments"
4. This ensures production only deploys from merged PRs

## Important Settings to Verify

After connecting, verify these in **Settings → General**:

- ✅ **Root Directory**: `apps/admin`
- ✅ **Framework Preset**: Next.js
- ✅ **Build Command**: (empty - auto-detected)
- ✅ **Output Directory**: `.next`
- ✅ **Install Command**: (empty - auto-detected)

And in **Settings → Git**:

- ✅ **Production Branch**: `feature/admin-dashboard`
- ✅ **Repository**: `NavneetPrajapati31/KOVARI` (or your repo name)

## Troubleshooting

### "Repository not found"
- Make sure you've granted Vercel access to your GitHub account
- Check GitHub → Settings → Applications → Authorized OAuth Apps → Vercel

### "Branch not found"
- Make sure `feature/admin-dashboard` branch exists and is pushed to GitHub
- Check: `git branch -a` to see all branches

### Auto-deploy not working
- Verify branch name matches exactly
- Check Vercel has access to the repository
- Look at Deployments tab for error messages

## Next Steps

Once connected:
1. ✅ Every push to `feature/admin-dashboard` will auto-deploy
2. ✅ You can create preview deployments for PRs
3. ✅ Production deployments only from the production branch
4. ✅ All environment variables are preserved

