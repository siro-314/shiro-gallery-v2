import { MediaItem, SearchFilters, SortField, SortOrder } from '../types';
import { StorageAdapter } from './base';

/**
 * LocalStorage実装 - プロトタイプ用
 */
export class LocalStorageAdapter extends StorageAdapter {
  private readonly STORAGE_KEY = 'shiro-gallery-items';
  private readonly METADATA_KEY = 'shiro-gallery-metadata';
  
  protected async initialize(): Promise<void> {
    await this.validateData();
  }
  
  async save(item: MediaItem): Promise<MediaItem> {
    const items = await this.findAll();
    const existingIndex = items.findIndex(i => i.id === item.id);
    
    if (existingIndex >= 0) {
      items[existingIndex] = { ...item, updatedAt: new Date() };
    } else {
      items.push(item);
    }
    
    this.saveToStorage(items);
    return item;
  }
  
  async findById(id: string): Promise<MediaItem | null> {
    const items = await this.findAll();
    return items.find(item => item.id === id) || null;
  }
  
  async findAll(): Promise<MediaItem[]> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.map(this.deserializeItem) : [];
    } catch (error) {
      console.error('Failed to load items from localStorage:', error);
      return [];
    }
  }
  
  async update(id: string, updates: Partial<MediaItem>): Promise<MediaItem> {
    const items = await this.findAll();
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }
    
    const updatedItem = {
      ...items[index],
      ...updates,
      updatedAt: new Date()
    };
    
    items[index] = updatedItem;
    this.saveToStorage(items);
    
    return updatedItem;
  }
  
  async delete(id: string): Promise<void> {
    const items = await this.findAll();
    const filteredItems = items.filter(item => item.id !== id);
    this.saveToStorage(filteredItems);
  }
  
  async search(
    filters: SearchFilters,
    sortField: SortField = 'createdAt',
    sortOrder: SortOrder = 'desc',
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    items: MediaItem[];
    total: number;
    hasMore: boolean;
  }> {
    const allItems = await this.findAll();
    let filteredItems = this.applyFilters(allItems, filters);
    
    filteredItems = this.applySorting(filteredItems, sortField, sortOrder);
    
    const total = filteredItems.length;
    const paginatedItems = filteredItems.slice(offset, offset + limit);
    
    return {
      items: paginatedItems,
      total,
      hasMore: offset + limit < total
    };
  }
  
  async saveBatch(items: MediaItem[]): Promise<MediaItem[]> {
    const existingItems = await this.findAll();
    const itemsMap = new Map(existingItems.map(item => [item.id, item]));
    
    items.forEach(item => {
      itemsMap.set(item.id, { ...item, updatedAt: new Date() });
    });
    
    const updatedItems = Array.from(itemsMap.values());
    this.saveToStorage(updatedItems);
    
    return items;
  }
  
  async deleteBatch(ids: string[]): Promise<void> {
    const items = await this.findAll();
    const idsSet = new Set(ids);
    const filteredItems = items.filter(item => !idsSet.has(item.id));
    this.saveToStorage(filteredItems);
  }
  
  async getStats(): Promise<{
    totalItems: number;
    itemsByType: Record<string, number>;
    storageUsed: number;
    lastUpdated: Date;
  }> {
    const items = await this.findAll();
    const itemsByType: Record<string, number> = {};
    
    items.forEach(item => {
      itemsByType[item.type] = (itemsByType[item.type] || 0) + 1;
    });
    
    const storageData = localStorage.getItem(this.STORAGE_KEY) || '';
    const storageUsed = new Blob([storageData]).size;
    
    return {
      totalItems: items.length,
      itemsByType,
      storageUsed,
      lastUpdated: new Date()
    };
  }
  
  async getAllTags(): Promise<string[]> {
    const items = await this.findAll();
    const tagsSet = new Set<string>();
    
    items.forEach(item => {
      item.tags.forEach(tag => tagsSet.add(tag));
    });
    
    return Array.from(tagsSet).sort();
  }
  
  async getAllCategories(): Promise<string[]> {
    const items = await this.findAll();
    const categoriesSet = new Set<string>();
    
    items.forEach(item => {
      item.categories.forEach(category => categoriesSet.add(category));
    });
    
    return Array.from(categoriesSet).sort();
  }
  
  async getTagUsageCount(): Promise<Record<string, number>> {
    const items = await this.findAll();
    const tagCount: Record<string, number> = {};
    
    items.forEach(item => {
      item.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    
    return tagCount;
  }
  
  async validateData(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const items = await this.findAll();
      
      items.forEach((item, index) => {
        if (!item.id) {
          errors.push(`Item at index ${index} missing ID`);
        }
        if (!item.type) {
          errors.push(`Item ${item.id || index} missing type`);
        }
        if (!item.title?.trim()) {
          warnings.push(`Item ${item.id || index} has empty title`);
        }
      });
      
    } catch (error) {
      errors.push(`Failed to validate data: ${error}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private saveToStorage(items: MediaItem[]): void {
    try {
      const serialized = items.map(this.serializeItem);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
      
      const metadata = {
        lastUpdated: new Date().toISOString(),
        itemCount: items.length,
        version: '2.0.0'
      };
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata));
      
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw new Error('Storage quota exceeded or other storage error');
    }
  }
  
  private serializeItem(item: MediaItem): any {
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      lastAccessedAt: item.lastAccessedAt?.toISOString()
    };
  }
  
  private deserializeItem(data: any): MediaItem {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastAccessedAt: data.lastAccessedAt ? new Date(data.lastAccessedAt) : undefined
    };
  }
  
  private applyFilters(items: MediaItem[], filters: SearchFilters): MediaItem[] {
    return items.filter(item => {
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchableText = [
          item.title,
          item.description || '',
          item.memo,
          ...item.tags,
          ...item.categories
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }
      
      if (filters.types && filters.types.length > 0) {
        if (!filters.types.includes(item.type)) {
          return false;
        }
      }
      
      if (filters.tags && filters.tags.length > 0) {
        const hasRequiredTags = filters.tags.every(tag =>
          item.tags.includes(tag)
        );
        if (!hasRequiredTags) {
          return false;
        }
      }
      
      if (filters.createdRange) {
        const { start, end } = filters.createdRange;
        const itemDate = item.createdAt;
        
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
      }
      
      if (filters.isFavorite !== undefined && item.isFavorite !== filters.isFavorite) {
        return false;
      }
      
      if (filters.isArchived !== undefined && item.isArchived !== filters.isArchived) {
        return false;
      }
      
      return true;
    });
  }
  
  private applySorting(items: MediaItem[], sortField: SortField, sortOrder: SortOrder): MediaItem[] {
    return items.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'updatedAt':
          aValue = a.updatedAt.getTime();
          bValue = b.updatedAt.getTime();
          break;
        case 'lastAccessedAt':
          aValue = a.lastAccessedAt?.getTime() || 0;
          bValue = b.lastAccessedAt?.getTime() || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'fileSize':
          aValue = a.metadata.fileSize || 0;
          bValue = b.metadata.fileSize || 0;
          break;
        default:
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
      }
      
      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
}
