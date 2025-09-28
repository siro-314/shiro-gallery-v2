const fs = require('fs')
const path = require('path')

/**
 * 新たに2025-09フォルダにアップロードされた16枚の画像を2024-02に修正
 */

async function fixNew2025Images() {
  try {
    console.log('🔧 新しく2025-09フォルダにある画像を2024-02に修正します...')
    
    // アートワークデータを読み込み
    const artworksPath = path.join(process.cwd(), 'public/data/artworks.json')
    const artworksData = JSON.parse(fs.readFileSync(artworksPath, 'utf8'))
    
    console.log(`📊 総アートワーク数: ${artworksData.length}`)
    
    // 2025-09フォルダのURLを持つアートワークを検索
    const problematicArtworks = artworksData.filter(artwork => 
      artwork.url && artwork.url.includes('/2025-09/')
    )
    
    console.log(`🔍 修正対象の画像: ${problematicArtworks.length}件`)
    
    if (problematicArtworks.length === 0) {
      console.log('✅ 修正対象の画像が見つかりませんでした')
      console.log('ℹ️  既に修正済みか、新しい画像がまだローカルに反映されていない可能性があります')
      return
    }
    
    // 最新の16件に絞る（もし16件以上ある場合）
    const targetArtworks = problematicArtworks.slice(0, 16)
    
    console.log(`\n🎯 修正対象: ${targetArtworks.length}件`)
    targetArtworks.forEach((artwork, index) => {
      console.log(`  ${index + 1}. ${artwork.originalName} (${artwork.id})`)
      console.log(`     現在URL: ${artwork.url}`)
      console.log(`     yearMonth: ${artwork.yearMonth}`)
    })
    
    // URLとyearMonthを修正
    const fixedArtworks = artworksData.map(artwork => {
      // 対象の16件のIDに該当する場合のみ修正
      if (targetArtworks.some(target => target.id === artwork.id)) {
        return {
          ...artwork,
          url: artwork.url.replace('/2025-09/', '/2024-02/'),
          yearMonth: '2024-02'
        }
      }
      return artwork
    })
    
    // 修正されたデータを保存
    fs.writeFileSync(artworksPath, JSON.stringify(fixedArtworks, null, 2))
    
    console.log(`\n✅ ${targetArtworks.length}件の画像を修正しました`)
    console.log('   URL: 2025-09 → 2024-02 に変更')
    console.log('   yearMonth: → 2024-02 に変更')
    
    // 修正後の確認
    const verification = fixedArtworks.filter(artwork => 
      artwork.url && artwork.url.includes('/2025-09/')
    )
    
    console.log(`📊 残存2025-09画像: ${verification.length}件`)
    
    // 2024-02の画像数を確認
    const feb2024Count = fixedArtworks.filter(artwork => artwork.yearMonth === '2024-02').length
    console.log(`📅 2024年2月の画像総数: ${feb2024Count}件`)
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

fixNew2025Images()
