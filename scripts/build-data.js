#!/usr/bin/env node

/**
 * 本番ビルド用データ取得スクリプト
 * GitHubリポジトリからデータを取得して静的ファイルとして保存
 */

const fs = require('fs').promises;
const path = require('path');

// 環境変数を読み込み（本番環境では.env.localが存在しないため条件分岐）
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

// 環境変数からGitHub設定を取得
function getGitHubConfig() {
  const config = {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER || 'siro-314',
    repo: process.env.GITHUB_REPO || 'shiro-gallery-data',
    branch: process.env.GITHUB_BRANCH || 'main'
  };

  if (!config.token) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  return config;
}

// GitHubからデータを取得
async function fetchArtworkData(config) {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/public/data/artworks.json`;
  
  console.log('📁 Fetching artwork data from GitHub...');
  console.log('   Repository:', `${config.owner}/${config.repo}`);
  console.log('   File path:', 'public/data/artworks.json');
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Shiro-Gallery-Build-Script'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('📝 No artwork data found (empty repository)');
        return [];
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const artworks = JSON.parse(content);
    
    console.log(`✅ Successfully fetched ${artworks.length} artworks`);
    return artworks;
    
  } catch (error) {
    console.error('❌ Failed to fetch artwork data:', error.message);
    console.log('📝 Using empty dataset for build');
    return [];
  }
}

// データファイルを生成
async function generateDataFiles(artworks) {
  const publicDir = path.join(process.cwd(), 'public');
  const dataDir = path.join(publicDir, 'data');
  
  // ディレクトリを作成
  await fs.mkdir(dataDir, { recursive: true });
  
  // GitHub設定を取得
  const config = getGitHubConfig();
  
  // 作品データの変換（静的サイト用にURL調整）
  const processedArtworks = artworks.map(artwork => ({
    ...artwork,
    // GitHub Raw URLに変換
    url: `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}${artwork.url}`
  }));
  
  // artworks.jsonを生成
  await fs.writeFile(
    path.join(dataDir, 'artworks.json'),
    JSON.stringify(processedArtworks, null, 2),
    'utf-8'
  );
  
  // 月別統計を生成
  const monthStats = {};
  processedArtworks.forEach(artwork => {
    if (!monthStats[artwork.yearMonth]) {
      monthStats[artwork.yearMonth] = 0;
    }
    monthStats[artwork.yearMonth]++;
  });
  
  const months = Object.entries(monthStats)
    .map(([yearMonth, count]) => {
      const [year, month] = yearMonth.split('-');
      return {
        yearMonth,
        count,
        year: parseInt(year, 10),
        month: parseInt(month, 10)
      };
    })
    .sort((a, b) => b.yearMonth.localeCompare(a.yearMonth)); // 新しい順
  
  const monthsData = {
    availableMonths: months,
    totalMonths: months.length,
    years: [...new Set(months.map(m => m.year))].sort((a, b) => b - a)
  };
  
  // months.jsonを生成
  await fs.writeFile(
    path.join(dataDir, 'months.json'),
    JSON.stringify(monthsData, null, 2),
    'utf-8'
  );
  
  console.log(`✅ Generated data files:`);
  console.log(`   📁 ${processedArtworks.length} artworks saved to public/data/artworks.json`);
  console.log(`   📅 ${months.length} months saved to public/data/months.json`);
  
  return { artworks: processedArtworks, months: monthsData };
}

// メイン実行
async function main() {
  try {
    console.log('🚀 Starting data generation for static build...');
    
    const config = getGitHubConfig();
    const artworks = await fetchArtworkData(config);
    const data = await generateDataFiles(artworks);
    
    console.log('🎉 Data generation completed successfully!');
    console.log(`📊 Summary: ${data.artworks.length} artworks across ${data.months.totalMonths} months`);
    
  } catch (error) {
    console.error('💥 Build script failed:', error.message);
    process.exit(1);
  }
}

// スクリプトが直接実行された場合にmainを呼び出し
if (require.main === module) {
  main();
}

module.exports = { main, fetchArtworkData, generateDataFiles };
