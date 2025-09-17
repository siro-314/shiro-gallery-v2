#!/bin/bash

# 開発・本番環境切り替えスクリプト
API_DEV_SOURCE="../api-dev-backup"

if [ "$NODE_ENV" = "production" ]; then
    echo "🏭 Setting up production environment..."
    
    # APIディレクトリを削除（静的エクスポート用）
    if [ -d "./app/api" ]; then
        rm -rf ./app/api
        echo "   📁 API routes removed for static export"
    fi
    
else
    echo "🧪 Setting up development environment..."
    
    # APIディレクトリを復元
    if [ -d "$API_DEV_SOURCE" ]; then
        if [ ! -d "./app/api" ]; then
            cp -r "$API_DEV_SOURCE" ./app/api
            echo "   📁 API routes enabled for development"
        fi
    else
        echo "   ⚠️  Warning: $API_DEV_SOURCE not found"
    fi
fi

echo "✅ Environment setup complete!"
