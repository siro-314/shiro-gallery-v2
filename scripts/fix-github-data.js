require('dotenv').config({ path: '.env.local' })
const { Octokit } = require('@octokit/rest')

/**
 * GitHub API経由で shiro-gallery-data リポジトリの artworks.json を修正
 * 2025-09フォルダの16枚を2024-02に修正
 */

async function fixGitHubData() {
  try {
    console.log('🔧 GitHub API経由でデータを修正します...')
    
    // GitHub API初期化
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    })
    
    const owner = process.env.GITHUB_OWNER || 'siro-314'
    const repo = process.env.GITHUB_DATA_REPO || 'shiro-gallery-data'
    const filePath = 'public/data/artworks.json'
    
    console.log(`📦 リポジトリ: ${owner}/${repo}`)
    console.log(`📄 ファイル: ${filePath}`)
    
    // 現在のファイルを取得
    console.log('📥 現在のデータを取得中...')
    const { data: fileData } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath
    })
    
    // Base64デコード
    const content = Buffer.from(fileData.content, 'base64').toString('utf8')
    const artworks = JSON.parse(content)
    
    console.log(`📊 総アートワーク数: ${artworks.length}`)
    
    // 2025-09フォルダのURLを持つアートワークを検索
    const problematicArtworks = artworks.filter(artwork => 
      artwork.url && artwork.url.includes('/2025-09/')
    )
    
    console.log(`🔍 修正対象: ${problematicArtworks.length}件`)
    
    if (problematicArtworks.length === 0) {
      console.log('✅ 修正対象の画像が見つかりませんでした')
      return
    }
    
    // 修正対象リストを表示
    console.log('\n📋 修正対象リスト:')
    problematicArtworks.forEach((artwork, index) => {
      console.log(`  ${index + 1}. ${artwork.originalName}`)
      console.log(`     yearMonth: ${artwork.yearMonth}`)
    })
    
    // URLとyearMonthを修正
    const fixedArtworks = artworks.map(artwork => {
      if (artwork.url && artwork.url.includes('/2025-09/')) {
        console.log(`🔄 修正: ${artwork.originalName}`)
        return {
          ...artwork,
          url: artwork.url.replace('/2025-09/', '/2024-02/'),
          yearMonth: '2024-02'
        }
      }
      return artwork
    })
    
    // 修正されたデータをGitHubに保存
    const newContent = JSON.stringify(fixedArtworks, null, 2)
    const newContentBase64 = Buffer.from(newContent).toString('base64')
    
    console.log('\n📤 GitHubに修正データをアップロード中...')
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message: 'fix: 2025-09の画像を2024-02に修正',
      content: newContentBase64,
      sha: fileData.sha
    })
    
    console.log(`\n✅ ${problematicArtworks.length}件の画像を修正しました`)
    console.log('   URL: 2025-09 → 2024-02 に変更')
    console.log('   yearMonth: → 2024-02 に変更')
    
    // 2024-02の画像数を確認
    const feb2024Count = fixedArtworks.filter(artwork => artwork.yearMonth === '2024-02').length
    console.log(`📅 2024年2月の画像総数: ${feb2024Count}件`)
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message)
    if (error.status) {
      console.error(`   HTTPステータス: ${error.status}`)
    }
  }
}

fixGitHubData()
