import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getProducts,
  getSingleProduct,
  getTrendingProducts,
  getVendorProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  deleteUploadedProductImage,
  searchProducts
} from '../../../controllers/productControllers.js';
import { Product } from '../../../models/productsModel.js';
import axios from 'axios';

// Mock modules
vi.mock('../../../models/productsModel.js', () => ({
  Product: {
    find: vi.fn(),
    findOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn()
  }
}));

vi.mock('axios');

vi.mock('../../../configs/cloudinaryConfigs.js', () => ({
  uploader: {
    destroy: vi.fn()
  }
}));

vi.mock('@emailjs/nodejs', () => ({
  default: {
    send: vi.fn()
  }
}));

describe('Product Controllers', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      auth: { uid: 'vendor123' },
      images: []
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
  });

  describe('getProducts', () => {
    it('should get products with default pagination', async () => {
      const mockProducts = [
        { productId: 'prod1', name: 'Product 1', price: 1000 },
        { productId: 'prod2', name: 'Product 2', price: 2000 }
      ];

      Product.find.mockReturnValue({
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockProducts)
        })
      });

      Product.countDocuments.mockResolvedValue(40);

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        data: mockProducts,
        totalPages: 2
      });
    });

    it('should filter products by price range', async () => {
      req.query = { minPrice: '1000', maxPrice: '5000', page: '1', limit: '10' };

      Product.find.mockReturnValue({
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([])
        })
      });

      Product.countDocuments.mockResolvedValue(0);

      await getProducts(req, res);

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          price: { $gte: '1000', $lte: '5000' }
        })
      );
    });

    it('should filter products by category', async () => {
      req.query = { category: ['electronics', 'clothing'] };

      Product.find.mockReturnValue({
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([])
        })
      });

      Product.countDocuments.mockResolvedValue(0);

      await getProducts(req, res);

      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          category: { $in: ['electronics', 'clothing'] }
        })
      );
    });

    it('should handle sorting', async () => {
      req.query = { sortBy: 'price', order: 'asc' };

      Product.find.mockReturnValue({
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([])
        })
      });

      Product.countDocuments.mockResolvedValue(0);

      await getProducts(req, res);

      expect(Product.find).toHaveBeenCalled();
    });

    it('should handle pagination', async () => {
      req.query = { page: '2', limit: '20' };

      Product.find.mockReturnValue({
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([])
        })
      });

      Product.countDocuments.mockResolvedValue(60);

      await getProducts(req, res);

      // Should skip first 20 items
      const callArgs = Product.find().skip.mock.calls[0];
      expect(callArgs[0]).toBe(20);
    });
  });

  describe('getSingleProduct', () => {
    it('should retrieve single product by id', async () => {
      req.query.id = 'prod123';

      const mockProduct = {
        productId: 'prod123',
        name: 'Test Product',
        price: 1500
      };

      Product.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockProduct)
      });

      await getSingleProduct(req, res);

      expect(Product.findOne).toHaveBeenCalledWith({ productId: 'prod123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProduct);
    });

    it('should handle product not found', async () => {
      req.query.id = 'nonexistent';

      Product.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      });

      await getSingleProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(null);
    });
  });

  describe('getTrendingProducts', () => {
    it('should return top 6 trending products sorted by ratings', async () => {
      const mockTrendingProducts = [
        { productId: 'prod1', name: 'Product 1', ratings: 5 },
        { productId: 'prod2', name: 'Product 2', ratings: 4.8 },
        { productId: 'prod3', name: 'Product 3', ratings: 4.5 }
      ];

      Product.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(mockTrendingProducts)
          })
        })
      });

      await getTrendingProducts(req, res);

      expect(Product.find).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(mockTrendingProducts);
    });
  });

  describe('getVendorProduct', () => {
    it('should get products for authenticated vendor', async () => {
      const mockVendorProducts = [
        { productId: 'prod1', vendorId: 'vendor123', name: 'Product 1' }
      ];

      Product.find.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockVendorProducts)
      });

      await getVendorProduct(req, res);

      expect(Product.find).toHaveBeenCalledWith({ vendorId: 'vendor123' });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('addProduct', () => {
    it('should add product successfully for verified vendor', async () => {
      req.auth.isVerified = { email: true, phone: true };
      req.body = {
        productName: 'New Product',
        price: 2000,
        category: 'electronics',
        description: 'A new product'
      };
      req.images = [{ url: 'url1', publicId: 'id1' }];

      Product.create.mockResolvedValue({
        productId: 'new-prod',
        name: 'New Product',
        ...req.body
      });

      await addProduct(req, res);

      expect(Product.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Product added successfully' });
    });

    it('should reject unverified vendor', async () => {
      req.auth.isVerified = { email: false, phone: false };
      req.body = { productName: 'New Product' };

      await addProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle product creation error', async () => {
      req.auth.isVerified = { email: true, phone: true };
      req.body = { productName: 'New Product' };

      Product.create.mockRejectedValue(new Error('Creation failed'));

      await addProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateProduct', () => {
    it('should update existing product', async () => {
      req.params.id = 'prod123';
      req.body = { productName: 'Updated Product', price: 3000 };
      req.images = [{ url: 'new-url', publicId: 'new-id' }];

      const existingProduct = {
        images: [{ url: 'old-url', publicId: 'old-id' }]
      };

      Product.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(existingProduct)
        })
      });

      Product.updateOne.mockResolvedValue({ acknowledged: true });

      await updateProduct(req, res);

      expect(Product.updateOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should merge images when updating', async () => {
      req.params.id = 'prod123';
      req.body = { productName: 'Updated' };
      req.images = [{ url: 'new-url', publicId: 'new-id' }];

      const existingProduct = {
        images: [{ url: 'old-url', publicId: 'old-id' }]
      };

      Product.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(existingProduct)
        })
      });

      Product.updateOne.mockResolvedValue({});

      await updateProduct(req, res);

      const updateCall = Product.updateOne.mock.calls[0];
      expect(updateCall[1].images).toHaveLength(2);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product and its images', async () => {
      req.query.productId = 'prod123';

      const mockProduct = {
        images: [
          { url: 'url1', publicId: 'id1' },
          { url: 'url2', publicId: 'id2' }
        ]
      };

      Product.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockProduct)
        })
      });

      Product.deleteOne.mockResolvedValue({ acknowledged: true });

      await deleteProduct(req, res);

      expect(Product.deleteOne).toHaveBeenCalledWith({ productId: 'prod123' });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteUploadedProductImage', () => {
    it('should delete specific product image', async () => {
      req.query = { productId: 'prod123', publicId: 'id-to-delete' };

      const mockProduct = {
        images: [
          { url: 'url1', publicId: 'id1' },
          { url: 'url2', publicId: 'id-to-delete' }
        ]
      };

      Product.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockProduct)
      });

      Product.updateOne.mockResolvedValue({});

      await deleteUploadedProductImage(req, res);

      expect(Product.updateOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('searchProducts', () => {
    it('should search products by vector similarity', async () => {
      req.query = {
        searchTerm: 'laptop',
        page: '1',
        limit: '20'
      };

      axios.post.mockResolvedValue({
        data: {
          embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
        }
      });

      const mockSearchResults = [
        { productId: 'prod1', name: 'Laptop Pro', score: 0.95 }
      ];

      Product.aggregate.mockResolvedValue(mockSearchResults);

      await searchProducts(req, res);

      expect(axios.post).toHaveBeenCalled();
      expect(Product.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should reject invalid search term', async () => {
      req.query = { searchTerm: 123 }; // Invalid - should be string

      await searchProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should filter search results by price range', async () => {
      req.query = {
        searchTerm: 'laptop',
        minPrice: '50000',
        maxPrice: '200000'
      };

      axios.post.mockResolvedValue({
        data: { embedding: [0.1, 0.2] }
      });

      Product.aggregate.mockResolvedValue([]);

      await searchProducts(req, res);

      const aggregateCall = Product.aggregate.mock.calls[0][0];
      expect(aggregateCall[0].$vectorSearch.filter.price).toBeDefined();
    });

    it('should filter search results by category', async () => {
      req.query = {
        searchTerm: 'laptop',
        category: ['electronics', 'computers']
      };

      axios.post.mockResolvedValue({
        data: { embedding: [0.1] }
      });

      Product.aggregate.mockResolvedValue([]);

      await searchProducts(req, res);

      expect(Product.aggregate).toHaveBeenCalled();
    });
  });
});
