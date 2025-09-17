// 作品データの型定義
export interface Artwork {
  id: string;
  filename: string;
  originalName: string;
  type: 'image' | 'video';
  url: string;
  comment?: string;
  uploadedAt: string;
  yearMonth: string; // YYYY-MM形式
  isMonthBoundary?: boolean; // 月境目フラグ
  dimensions?: {
    width: number;
    height: number;
  };
}

// 月データの型定義
export interface MonthData {
  yearMonth: string;
  artworks: Artwork[];
  totalCount: number;
}

// アップロードリクエストの型定義
export interface UploadRequest {
  files: FileData[];
  yearMonth: string;
  monthBoundary?: boolean;
}

export interface FileData {
  name: string;
  content: string; // Base64エンコードされたファイルデータ
  type: string; // MIMEタイプ
  comment?: string;
}

// GitHub API レスポンスの型定義
export interface GitHubFileResponse {
  content: {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
  };
  commit: {
    sha: string;
    message: string;
  };
}

// 設定オブジェクトの型定義
export interface StorageConfig {
  owner: string;
  repo: string;
  branch: string;
  dataPath: string;
  imagePath: string;
}
