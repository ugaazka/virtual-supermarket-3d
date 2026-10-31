import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
const target=process.env.API_PROXY_TARGET||'http://127.0.0.1:3001';
// Preserve the browser Host header so the API's same-origin checks work on LAN too.
export default defineConfig({plugins:[react()],server:{port:5173,proxy:{'/api':{target,changeOrigin:false},'/uploads':{target,changeOrigin:false}}},build:{outDir:'dist',rollupOptions:{output:{manualChunks:{three:['three','@react-three/fiber','@react-three/drei']}}}}});
