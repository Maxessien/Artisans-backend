import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import { cleanUpStorage, populateUserCart, userAllowedFields } from '../../../utils/usersUtilFns.js';
import { Product } from '../../../models/productsModel.js';

// Mock fs module
vi.mock('fs');

// Mock Product model
vi.mock('../../../models/productsModel.js', () => ({
  Product: {
    find: vi.fn()
  }
}));

describe('usersUtilFns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cleanUpStorage', () => {
    it('should delete a single file when given a string path', () => {
      const testPath = '/path/to/file.txt';
      fs.rmSync.mockImplementation(() => {});
      
      const result = cleanUpStorage(testPath);
      
      expect(fs.rmSync).toHaveBeenCalledWith(testPath);
      expect(result).toEqual({ success: 'ok' });
    });

    it('should delete multiple files when given an array of paths', () => {
      const testPaths = ['/path/to/file1.txt', '/path/to/file2.txt'];
      fs.rmSync.mockImplementation(() => {});
      
      const result = cleanUpStorage(testPaths);
      
      expect(fs.rmSync).toHaveBeenCalledTimes(testPaths.length);
      testPaths.forEach(path => {
        expect(fs.rmSync).toHaveBeenCalledWith(path);
      });
      expect(result).toEqual({ success: 'ok' });
    });

    it('should throw error when path is neither string nor array', () => {
      expect(() => cleanUpStorage(123)).toThrow('Path to file must be a string or array of strings');
      expect(() => cleanUpStorage(null)).toThrow('Path to file must be a string or array of strings');
      expect(() => cleanUpStorage({})).toThrow('Path to file must be a string or array of strings');
    });

    it('should throw error when fs.rmSync fails', () => {
      const testPath = '/invalid/path';
      fs.rmSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      
      expect(() => cleanUpStorage(testPath)).toThrow('File not found');
    });
  });

  describe('populateUserCart', () => {
    it('should return empty array for empty cart', async () => {
      const result = await populateUserCart([]);
      expect(result).toEqual([]);
    });

    it('should return empty array for null or undefined cart', async () => {
      expect(await populateUserCart(null)).toEqual([]);
      expect(await populateUserCart(undefined)).toEqual([]);
    });

    it('should populate cart with product details', async () => {
      const userCart = [
        { productId: 'prod1', quantity: 2, variant: 'red' },
        { productId: 'prod2', quantity: 1 }
      ];

      const mockProducts = [
        { 
          productId: 'prod1', 
          name: 'Product 1', 
          price: 1000,
          images: [],
          vendorId: 'vendor1'
        },
        { 
          productId: 'prod2', 
          name: 'Product 2', 
          price: 2000,
          images: [],
          vendorId: 'vendor2'
        }
      ];

      Product.find.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockProducts)
      });

      const result = await populateUserCart(userCart);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        productId: 'prod1',
        quantity: 2,
        variant: 'red',
        name: 'Product 1',
        price: 1000
      });
      expect(result[1]).toMatchObject({
        productId: 'prod2',
        quantity: 1,
        name: 'Product 2',
        price: 2000
      });
    });

    it('should handle cases where product is not found', async () => {
      const userCart = [
        { productId: 'prod1', quantity: 2 },
        { productId: 'nonexistent', quantity: 1 }
      ];

      const mockProducts = [
        { 
          productId: 'prod1', 
          name: 'Product 1', 
          price: 1000
        }
      ];

      Product.find.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockProducts)
      });

      const result = await populateUserCart(userCart);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeDefined();
      expect(result[1]).toBeUndefined();
    });

    it('should throw error when Product.find fails', async () => {
      const userCart = [{ productId: 'prod1', quantity: 2 }];

      Product.find.mockReturnValue({
        lean: vi.fn().mockRejectedValue(new Error('Database error'))
      });

      await expect(populateUserCart(userCart)).rejects.toThrow('Database error');
    });
  });

  describe('userAllowedFields', () => {
    const expectedFields = [
      'displayName', 
      'userId', 
      'profilePicture', 
      'email', 
      'phoneNumber', 
      'cart', 
      'orderHistory', 
      'following', 
      'wishlist', 
      'reviewsMade', 
      'orderPoints'
    ];

    it('should return all default fields when given empty exclusions array', () => {
      const result = userAllowedFields([]);
      expect(result).toEqual(expectedFields);
      expect(result).toHaveLength(11);
    });

    it('should exclude specified string field', () => {
      const result = userAllowedFields('role');
      // 'role' is not in default fields, so nothing changes
      expect(result).toEqual(expectedFields);
    });

    it('should exclude multiple specified fields from array', () => {
      const result = userAllowedFields(['displayName', 'email']);
      
      expect(result).not.toContain('displayName');
      expect(result).not.toContain('email');
      expect(result).toContain('userId');
      expect(result).toContain('phoneNumber');
      expect(result).toHaveLength(9);
    });

    it('should return correct fields when excluding single string', () => {
      const result = userAllowedFields('displayName');
      
      expect(result).not.toContain('displayName');
      expect(result).toContain('userId');
      expect(result).toHaveLength(10);
    });

    it('should throw error when exclusions is invalid type', () => {
      expect(() => userAllowedFields(123)).toThrow('exclusions must be a string or Array of strings');
      expect(() => userAllowedFields(null)).toThrow('exclusions must be a string or Array of strings');
      expect(() => userAllowedFields({})).toThrow('exclusions must be a string or Array of strings');
    });

    it('should handle excluding all fields', () => {
      const result = userAllowedFields(expectedFields);
      expect(result).toEqual([]);
    });
  });
});
