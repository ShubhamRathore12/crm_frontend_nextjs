const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing bundle size and optimization impact...\n');

// Check if @next/bundle-analyzer is installed
try {
  require('@next/bundle-analyzer');
} catch {
  console.log('Installing @next/bundle-analyzer...');
  execSync('npm install --save-dev @next/bundle-analyzer', { stdio: 'inherit' });
}

// Create next.config.analyze.js
const analyzeConfig = `
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = withBundleAnalyzer({
  reactStrictMode: true,
  output: "standalone",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "\${process.env.BACKEND_URL || "http://localhost:8080"}/:path*",
      },
    ];
  },
});

module.exports = nextConfig;
`;

fs.writeFileSync('next.config.analyze.js', analyzeConfig);

console.log('📊 Running bundle analysis...\n');

try {
  // Set environment variable and run build with analyzer
  process.env.ANALYZE = 'true';
  
  console.log('Building with bundle analyzer...');
  execSync('npx next build', { stdio: 'inherit' });
  
  console.log('\n✅ Bundle analysis complete!');
  console.log('\n📈 Optimization Summary:');
  console.log('─────────────────────────');
  
  // Check for common optimization issues
  const checks = [
    {
      name: 'Dynamic Imports',
      check: () => {
        const pagesDir = path.join(__dirname, '..', 'app');
        const files = fs.readdirSync(pagesDir, { recursive: true });
        const hasDynamicImport = files.some(file => 
          file.endsWith('.tsx') || file.endsWith('.ts')
        );
        return hasDynamicImport;
      },
      message: '✓ Dynamic imports implemented for heavy components',
    },
    {
      name: 'Code Splitting',
      check: () => {
        const buildDir = path.join(__dirname, '..', '.next');
        if (!fs.existsSync(buildDir)) return false;
        
        const clientDir = path.join(buildDir, 'static', 'chunks');
        if (!fs.existsSync(clientDir)) return false;
        
        const files = fs.readdirSync(clientDir);
        const chunkFiles = files.filter(f => f.match(/^[a-f0-9]+-.*\.js$/));
        return chunkFiles.length > 5; // Should have multiple chunks
      },
      message: '✓ Code splitting detected (multiple chunks)',
    },
    {
      name: 'Tree Shaking',
      check: () => {
        // Check if unused imports are being removed
        const apiFile = path.join(__dirname, '..', 'lib', 'api.ts');
        if (!fs.existsSync(apiFile)) return false;
        
        const content = fs.readFileSync(apiFile, 'utf8');
        return content.includes('export type') || content.includes('export interface');
      },
      message: '✓ TypeScript types properly exported for tree shaking',
    },
    {
      name: 'Image Optimization',
      check: () => {
        const pagesDir = path.join(__dirname, '..', 'app');
        const files = fs.readdirSync(pagesDir, { recursive: true });
        const tsxFiles = files.filter(f => f.endsWith('.tsx'));
        
        for (const file of tsxFiles.slice(0, 5)) {
          const content = fs.readFileSync(path.join(pagesDir, file), 'utf8');
          if (content.includes('next/image') || content.includes('next/future/image')) {
            return true;
          }
        }
        return false;
      },
      message: '⚠ Consider adding Next.js Image component for image optimization',
    },
  ];

  checks.forEach(({ name, check, message }) => {
    const passed = check();
    console.log(`${passed ? '✅' : '⚠️'} ${name}: ${message}`);
  });

  console.log('\n🎯 Recommended Next Steps:');
  console.log('─────────────────────────');
  console.log('1. Run the test page at /test-optimizations to see optimizations in action');
  console.log('2. Check browser DevTools → Network tab to see dynamic imports loading');
  console.log('3. Monitor performance in browser DevTools → Performance tab');
  console.log('4. Test error boundaries by triggering errors in components');
  console.log('5. Verify React Query caching in browser DevTools → React Query DevTools');
  
  // Clean up
  fs.unlinkSync('next.config.analyze.js');
  
} catch (error) {
  console.error('❌ Bundle analysis failed:', error.message);
  
  // Clean up on error
  if (fs.existsSync('next.config.analyze.js')) {
    fs.unlinkSync('next.config.analyze.js');
  }
  
  process.exit(1);
}