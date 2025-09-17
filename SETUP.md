# シロの保管庫 v2.0 - GitHub API連携ガイド

## 🚀 セットアップ手順

### 1. GitHub Personal Access Token の作成

1. GitHubにログイン
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. "Generate new token (classic)" をクリック
4. 必要な権限を設定：
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. トークンをコピーして保存

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の内容を設定：

```bash
# 必須設定
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_OWNER=your_github_username
GITHUB_REPO=shiro-gallery-data

# オプション設定（デフォルト値あり）
GITHUB_BRANCH=main
DATA_PATH=public/data
IMAGE_PATH=public/images
```

### 3. データ用リポジトリの作成

1. GitHubで新しいリポジトリ `shiro-gallery-data` を作成
2. 以下のディレクトリ構造を作成：
   ```
   shiro-gallery-data/
   ├── public/
   │   ├── data/
   │   │   └── artworks.json (空の配列 [])
   │   └── images/
   └── README.md
   ```

### 4. 開発環境での起動

```bash
npm install
npm run dev
```

管理画面: `http://localhost:3000/admin-k9m2x7p3`

## 🏗️ アーキテクチャ

### 疎結合設計の特徴

- **GitHubStorageManager**: ストレージ層の抽象化
- **ArtworkDataManager**: データ管理ロジックの分離
- **ConfigManager**: 設定管理の一元化
- **API Routes**: フロントエンドとバックエンドの分離

### 拡張性への配慮

- インターフェース統一により、他のストレージ（AWS S3、Cloudinary等）への移行が容易
- 型安全性を重視したTypeScript実装
- エラーハンドリングと堅牢性の確保

## 📁 ディレクトリ構造

```
app/
├── lib/                    # コアライブラリ（疎結合設計）
│   ├── types.ts           # 型定義
│   ├── GitHubStorageManager.ts  # GitHub API管理
│   ├── ArtworkDataManager.ts    # データ管理層
│   └── ConfigManager.ts   # 設定管理
├── api/
│   └── upload/            # アップロード API
│       └── route.ts
└── admin-k9m2x7p3/        # 管理画面
    └── components/
        └── FileUpload.tsx # API連携アップロードUI
```

## 🔧 技術スタック

- **Frontend**: Next.js 15 (App Router) + React 18 + TypeScript
- **Styling**: TailwindCSS
- **Storage**: GitHub API + Git リポジトリ
- **Deployment**: Netlify (静的エクスポート)
- **State Management**: React Hooks

## ⚠️ 注意事項

- GitHub APIのレート制限に注意（1時間あたり5000リクエスト）
- 大容量ファイルはGitHub LFSの利用を検討
- 本番環境では環境変数をNetlify環境変数に設定
