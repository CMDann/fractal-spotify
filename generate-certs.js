const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const certsDir = path.join(__dirname, 'certs');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir);
    console.log('Created certs directory');
}

const keyPath = path.join(certsDir, 'localhost.key');
const certPath = path.join(certsDir, 'localhost.crt');

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('SSL certificates already exist');
    console.log(`Key: ${keyPath}`);
    console.log(`Certificate: ${certPath}`);
    return;
}

try {
    console.log('Generating self-signed SSL certificate for localhost...');
    
    // Generate private key
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    
    // Generate certificate
    const opensslCommand = `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`;
    execSync(opensslCommand, { stdio: 'inherit' });
    
    console.log('✅ SSL certificates generated successfully!');
    console.log(`Key: ${keyPath}`);
    console.log(`Certificate: ${certPath}`);
    console.log('');
    console.log('⚠️  Important Notes:');
    console.log('1. These are self-signed certificates for development only');
    console.log('2. Your browser will show a security warning - this is normal');
    console.log('3. Click "Advanced" and "Proceed to localhost" to continue');
    console.log('4. For production, use proper SSL certificates from a CA');
    console.log('');
    console.log('Now you can run: npm run start:https');
    
} catch (error) {
    console.error('❌ Error generating certificates:', error.message);
    console.log('');
    console.log('Alternative: Create certificates manually:');
    console.log('1. Install OpenSSL if not available');
    console.log('2. Run these commands:');
    console.log(`   openssl genrsa -out "${keyPath}" 2048`);
    console.log(`   openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`);
    console.log('');
    console.log('Or use mkcert for easier local development:');
    console.log('1. Install mkcert: https://github.com/FiloSottile/mkcert');
    console.log('2. Run: mkcert -install');
    console.log(`3. Run: mkcert -key-file "${keyPath}" -cert-file "${certPath}" localhost 127.0.0.1`);
}