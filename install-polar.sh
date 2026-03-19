#!/bin/bash
# Script to install Polar packages after clearing npm cache

echo "Step 1: Removing node_modules and lock files..."
rm -rf node_modules package-lock.json

echo "Step 2: Cleaning npm cache..."
npm cache clean --force

echo "Step 3: Installing packages..."
npm install --legacy-peer-deps

echo "Done!"
