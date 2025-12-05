import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  placeOrders,
  getOrderHistory,
  cancelOrder,
  getVendorOrders,
  updateOrderStatus
} from '../../../controllers/ordersControllers.js';
import { Order } from '../../../models/ordersModel.js';
import { User } from '../../../models/usersModel.js';
import { populateUserCart } from '../../../utils/usersUtilFns.js';

// Mock modules
vi.mock('../../../models/ordersModel.js', () => ({
  Order: {
    insertMany: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    updateOne: vi.fn(),
    findOneAndUpdate: vi.fn()
  }
}));

vi.mock('../../../models/usersModel.js', () => ({
  User: {
    findOne: vi.fn(),
    updateOne: vi.fn()
  }
}));

vi.mock('../../../utils/usersUtilFns.js', () => ({
  populateUserCart: vi.fn()
}));

describe('Orders Controllers', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      body: {},
      params: {},
      query: {},
      auth: { uid: 'user123' }
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
  });

  describe('placeOrders', () => {
    it('should place orders from user cart', async () => {
      const mockUser = {
        userId: 'user123',
        email: 'user@example.com',
        phoneNumber: '+2341234567890',
        cart: [
          { productId: 'prod1', quantity: 2 },
          { productId: 'prod2', quantity: 1 }
        ]
      };

      const mockPopulatedCart = [
        {
          productId: 'prod1',
          name: 'Product 1',
          price: 1000,
          quantity: 2,
          vendorId: 'vendor1'
        },
        {
          productId: 'prod2',
          name: 'Product 2',
          price: 2000,
          quantity: 1,
          vendorId: 'vendor2'
        }
      ];

      req.body = { address: '123 Main St' };

      User.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser)
      });

      populateUserCart.mockResolvedValue(mockPopulatedCart);
      Order.insertMany.mockResolvedValue({});
      User.updateOne.mockResolvedValue({});

      await placeOrders(req, res);

      expect(Order.insertMany).toHaveBeenCalled();
      const insertedOrders = Order.insertMany.mock.calls[0][0];
      expect(insertedOrders).toHaveLength(2);
      expect(insertedOrders[0]).toMatchObject({
        productId: 'prod1',
        quantityOrdered: 2,
        address: '123 Main St'
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should clear user cart after order placement', async () => {
      const mockUser = {
        userId: 'user123',
        email: 'user@example.com',
        phoneNumber: '+2341234567890',
        cart: []
      };

      User.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser)
      });

      populateUserCart.mockResolvedValue([]);
      Order.insertMany.mockResolvedValue({});
      User.updateOne.mockResolvedValue({});

      req.body = { address: '123 Main St' };

      await placeOrders(req, res);

      expect(User.updateOne).toHaveBeenCalledWith(
        { userId: 'user123' },
        { cart: [] }
      );
    });

    it('should include product variant in order', async () => {
      const mockUser = {
        userId: 'user123',
        email: 'user@example.com',
        phoneNumber: '+2341234567890',
        cart: [{ productId: 'prod1', quantity: 1, variant: 'red' }]
      };

      const mockPopulatedCart = [
        {
          productId: 'prod1',
          name: 'Product 1',
          price: 1000,
          quantity: 1,
          vendorId: 'vendor1'
        }
      ];

      req.body = { address: '123 Main St', variant: 'red' };

      User.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser)
      });

      populateUserCart.mockResolvedValue(mockPopulatedCart);
      Order.insertMany.mockResolvedValue({});
      User.updateOne.mockResolvedValue({});

      await placeOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle order placement error', async () => {
      User.findOne.mockReturnValue({
        lean: vi.fn().mockRejectedValue(new Error('DB error'))
      });

      req.body = { address: '123 Main St' };

      await placeOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getOrderHistory', () => {
    it('should get user order history', async () => {
      const mockOrders = [
        {
          orderId: 'order1',
          productId: 'prod1',
          deliveryStatus: 'pending',
          userId: 'user123'
        }
      ];

      req.query = {};

      Order.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue(mockOrders)
          })
        })
      });

      await getOrderHistory(req, res);

      expect(Order.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: { $in: 'user123' }
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    it('should filter orders by status', async () => {
      req.query = { status: 'pending' };

      Order.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([])
          })
        })
      });

      await getOrderHistory(req, res);

      expect(Order.find).toHaveBeenCalled();
    });

    it('should sort orders by specified field', async () => {
      req.query = { orderBy: 'createdAt', direction: 'desc' };

      Order.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([])
          })
        })
      });

      await getOrderHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order for authorized user', async () => {
      req.params.orderId = 'order123';

      const mockOrder = {
        orderId: 'order123',
        userId: 'user123'
      };

      Order.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockOrder)
        })
      });

      Order.updateOne.mockResolvedValue({});

      await cancelOrder(req, res);

      expect(Order.updateOne).toHaveBeenCalledWith(
        { orderId: 'order123' },
        { deliveryStatus: 'cancelled' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should deny cancellation by unauthorized user', async () => {
      req.params.orderId = 'order123';

      const mockOrder = {
        orderId: 'order123',
        userId: 'different-user'
      };

      Order.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockOrder)
        })
      });

      await cancelOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getVendorOrders', () => {
    it('should get vendor orders', async () => {
      const mockVendorOrders = [
        {
          orderId: 'order1',
          vendorId: 'vendor123',
          deliveryStatus: 'pending'
        }
      ];

      req.query = {};

      Order.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            skip: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(mockVendorOrders)
            })
          })
        })
      });

      req.auth.uid = 'vendor123';

      await getVendorOrders(req, res);

      expect(Order.find).toHaveBeenCalledWith(
        expect.objectContaining({
          vendorId: 'vendor123'
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle pagination for vendor orders', async () => {
      req.query = { page: '2', limit: '10' };
      req.auth.uid = 'vendor123';

      Order.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            skip: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([])
            })
          })
        })
      });

      await getVendorOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status for vendor', async () => {
      req.body = { orderId: 'order123', deliveryStatus: 'delivered' };
      req.auth.uid = 'vendor123';

      const mockOrder = {
        orderId: 'order123',
        vendorId: 'vendor123'
      };

      Order.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockOrder)
        })
      });

      Order.findOneAndUpdate.mockResolvedValue({ acknowledged: true });

      await updateOrderStatus(req, res);

      expect(Order.findOneAndUpdate).toHaveBeenCalledWith(
        { orderId: 'order123' },
        { deliveryStatus: 'delivered' }
      );
    });

    it('should deny status update by unauthorized vendor', async () => {
      req.body = { orderId: 'order123', deliveryStatus: 'delivered' };
      req.auth.uid = 'vendor123';

      const mockOrder = {
        orderId: 'order123',
        vendorId: 'different-vendor'
      };

      Order.findOne.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockOrder)
        })
      });

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
