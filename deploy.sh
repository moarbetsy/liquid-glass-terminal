#!/bin/bash

# Deployment script for Liquid Glass Dashboard
# For moarbetsy/liquid-glass-dashboard

echo "🚀 Setting up Liquid Glass Dashboard for GitHub Pages..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git config user.name "moarbetsy"
    git config user.email "moarbetsy@gmail.com"
fi

# Add all files
echo "📦 Adding files..."
git add .

# Commit
echo "💾 Committing changes..."
git commit -m "Setup Liquid Glass Dashboard with authentication and GitHub Pages"

# Set main branch
git branch -M main

# Add remote (will fail if already exists, that's ok)
echo "🔗 Adding remote repository..."
git remote add origin https://github.com/moarbetsy/liquid-glass-dashboard.git 2>/dev/null || echo "Remote already exists"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Deployment setup complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://github.com/moarbetsy/liquid-glass-dashboard"
echo "2. Navigate to Settings → Pages"
echo "3. Set Source to 'GitHub Actions'"
echo "4. Your app will be available at: https://moarbetsy.github.io/liquid-glass-dashboard/"
echo ""
echo "Default login: admin / admin"
echo ""