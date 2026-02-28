# プロジェクト作成とライブラリのインストール
npm create vite@latest chronos-cosmos -- --template react
cd chronos-cosmos
npm install three @types/three @react-three/fiber @react-three/drei @react-three/postprocessing gsap zustand lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

ライブラリ	公式URL	役割
React Three Fiber	pmnd.rs/fiber	Three.jsをReactで宣言的に扱うための核。
Drei	pmnd.rs/drei	3D実装を爆速にする便利なヘルパー関数群。
Post-processing	pmnd.rs/postprocessing	安っぽさを消すための「光の滲み」や「霧」を実現。
GSAP	gsap.com	映画のようなカメラワークとUI遷移を制御。
Zustand	pmnd.rs/zustand	宇宙のTier設定や通貨データを3Dに渡す高速エンジン。