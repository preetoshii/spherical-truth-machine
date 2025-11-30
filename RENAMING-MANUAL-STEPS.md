# Manual Steps for Renaming to Spherical Truth Machine

All codebase changes have been completed. Follow these steps to complete the renaming on external services.

## 1. GitHub Repository Rename

**Action Required:** Rename your GitHub repository

1. Go to your repository: https://github.com/preetoshii/bounsight
2. Click **Settings** (top right, gear icon)
3. Scroll down to **Repository name** section
4. Change from: `bounsight`
5. Change to: `spherical-truth-machine`
6. Click **Rename**

**Important Notes:**
- GitHub will automatically redirect old URLs to the new name
- All existing clones will need to update their remote URL:
  ```bash
  git remote set-url origin https://github.com/preetoshii/spherical-truth-machine.git
  ```
- The codebase has already been updated to use the new repo name, so after renaming, everything will work correctly

## 2. Vercel Project Rename

**Action Required:** Update project name in Vercel dashboard

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Find your project (currently named "bounsight" or similar)
3. Click on the project
4. Go to **Settings** → **General**
5. Find **Project Name** field
6. Change from: `bounsight` (or current name)
7. Change to: `spherical-truth-machine`
8. Save changes

**Important Notes:**
- Project URL will change (e.g., `bounsight.vercel.app` → `spherical-truth-machine.vercel.app`)
- If you have a custom domain, update DNS records if needed
- Deployment will continue to work automatically

## 3. Local Directory (Optional)

**Action Required:** Rename your local project directory (optional but recommended)

If you want to rename your local folder:

```bash
# Navigate to parent directory
cd /Users/preetoshi

# Rename the directory
mv bounsight spherical-truth-machine

# Update your terminal to the new directory
cd spherical-truth-machine

# Update git remote (if you haven't already)
git remote set-url origin https://github.com/preetoshii/spherical-truth-machine.git
```

**Note:** This is optional - the app will work fine with the old directory name, but renaming keeps everything consistent.

## 4. Environment Variables Check

**Action Required:** Verify environment variables

Check if you have any environment variables or secrets that reference "bounsight":

1. **GitHub Token:** If your GitHub token has specific repo permissions, you may need to regenerate it or update permissions
2. **Vercel Environment Variables:** Check Vercel dashboard → Settings → Environment Variables for any references
3. **Local `.env` files:** Check for any hardcoded references (though these are typically gitignored)

## 5. Testing Checklist

After completing manual steps, test the following:

- [ ] GitHub API connectivity (messages.json fetching works)
- [ ] Vercel deployment succeeds
- [ ] Web app loads correctly
- [ ] Android build works (will require uninstall/reinstall due to package name change)
- [ ] iOS build works in Xcode
- [ ] All GitHub API calls use new repo name

## Important Warnings

### Android Package Change
- The Android package name has changed from `com.preetoshi.bounsight` to `com.preetoshi.spherical-truth-machine`
- **This means it's a completely different app** from Android's perspective
- Users will need to **uninstall the old app** before installing the new one
- If you've published to Play Store, you cannot change the package name - you'd need to publish as a new app

### iOS Bundle Identifier Change
- The iOS bundle identifier has changed from `com.anonymous.bounsight-app` to `com.anonymous.spherical-truth-machine`
- **This means it's a completely different app** from iOS's perspective
- Same considerations as Android - users need to uninstall old version
- If published to App Store, you'd need to publish as a new app

### Git Remote Update
After renaming the GitHub repo, update your local git remote:
```bash
git remote set-url origin https://github.com/preetoshii/spherical-truth-machine.git
```

## Summary

✅ **Codebase changes:** Complete
⏳ **GitHub repo rename:** Manual step required
⏳ **Vercel project rename:** Manual step required
⏳ **Local directory rename:** Optional
⏳ **Testing:** Required after manual steps

Once you complete the GitHub and Vercel renames, everything should work seamlessly!

