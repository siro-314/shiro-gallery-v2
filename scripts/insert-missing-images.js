require('dotenv').config({ path: '.env.local' });
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// 挿入位置の定義（元の画像の後に挿入）
const insertionPlan = [
  {
    file: '/Users/kitazawaharesora/Downloads/IMG_7467.WEBP',
    afterImage: 'IMG_9763.webp', // Position 6: この画像の後に挿入
    comment: ''
  },
  {
    file: '/Users/kitazawaharesora/Downloads/無題127_20240108153820.png',  
    afterImage: 'IMG_9431.webp', // Position 12: この画像の後に挿入
    comment: ''
  },
  {
    file: '/Users/kitazawaharesora/Downloads/無題133_20240124172304.png',
    afterImage: 'IMG_7886.webp', // Position 35: この画像の後に挿入  
    comment: ''
  },
  {
    file: '/Users/kitazawaharesora/Downloads/IMG_9357.WEBP',
    afterImage: 'IMG_7839.webp', // Position 36: 35番目の画像の後に挿入
    comment: ''
  }
];

async function insertMissingImages() {
  try {
    console.log('📥 Inserting missing images into 2024-01...');
    
    // artworks.jsonを取得
    const response = await octokit.repos.getContent({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json'
    });
    
    const artworks = JSON.parse(Buffer.from(response.data.content, 'base64').toString());
    const newArtworks = [];
    
    for (const plan of insertionPlan) {
      console.log(`\n🔄 Processing: ${path.basename(plan.file)}`);
      
      // ファイルが存在するか確認
      if (!fs.existsSync(plan.file)) {
        console.error(`❌ File not found: ${plan.file}`);
        continue;
      }
      
      // 挿入位置を決定するため、参照画像のタイムスタンプを取得
      const referenceImage = artworks.find(a => a.originalName === plan.afterImage);
      if (!referenceImage) {
        console.error(`❌ Reference image not found: ${plan.afterImage}`);
        continue;
      }
      
      // 参照画像の1秒前のタイムスタンプを計算（挿入位置調整）
      const referenceTime = new Date(referenceImage.uploadedAt);
      const insertTime = new Date(referenceTime.getTime() - 1000); // 1秒前
      
      // ファイルを読み取り
      const fileBuffer = fs.readFileSync(plan.file);
      const base64Content = fileBuffer.toString('base64');
      const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
      
      console.log(`📊 File size: ${fileSizeMB}MB`);
      
      // ファイル名とIDを生成
      const originalName = path.basename(plan.file);
      const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const extension = path.extname(originalName).toLowerCase().substring(1);
      const newFilename = `${fileId}.webp`; // 全てWebPに統一
      
      // GitHub Storageにアップロード
      const imagePath = `public/images/2024-01/${newFilename}`;
      
      await octokit.repos.createOrUpdateFileContents({
        owner: 'siro-314',
        repo: 'shiro-gallery-data',
        path: imagePath,
        message: `📥 復元: ${originalName} (2024-01の${plan.afterImage}の後に挿入)`,
        content: base64Content
      });
      
      console.log(`✅ Uploaded to: ${imagePath}`);
      
      // Artworkオブジェクトを作成
      const newArtwork = {
        id: fileId,
        filename: newFilename,
        originalName: originalName,
        type: 'image',
        url: `/images/2024-01/${newFilename}`,
        comment: plan.comment,
        uploadedAt: insertTime.toISOString(),
        yearMonth: '2024-01',
        isMonthBoundary: false
      };
      
      newArtworks.push(newArtwork);
      console.log(`📝 Created artwork entry for: ${originalName}`);
      
      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 新しいアートワークを既存データに追加
    const updatedArtworks = [...artworks, ...newArtworks]
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
    // artworks.jsonを更新  
    const newContent = Buffer.from(JSON.stringify(updatedArtworks, null, 2)).toString('base64');
    
    await octokit.repos.createOrUpdateFileContents({
      owner: 'siro-314',
      repo: 'shiro-gallery-data',
      path: 'public/data/artworks.json',
      message: `📥 復元完了: 抜けていた4枚の画像を2024-01に正しい位置で挿入`,
      content: newContent,
      sha: response.data.sha
    });
    
    console.log('\n✅ artworks.json updated successfully');
    console.log(`📊 Total artworks: ${updatedArtworks.length} (added ${newArtworks.length} images)`);
    
    // 2024-01の最終確認
    const jan2024Count = updatedArtworks.filter(a => a.yearMonth === '2024-01').length;
    console.log(`📅 2024-01 now contains: ${jan2024Count} images (should be 48)`);
    
    console.log('\n🎉 Missing images insertion completed!');
    
  } catch (error) {
    console.error('❌ Error inserting missing images:', error.message);
  }
}

insertMissingImages();
