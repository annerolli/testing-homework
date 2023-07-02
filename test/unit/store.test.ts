import { CartApi, ExampleApi } from '../../src/client/api';
import { Product } from '../../src/common/types';
import {
  addToCart,
  checkout,
  checkoutComplete,
  clearCart,
  initStore,
  productsLoad,
} from './../../src/client/store';

const stubProduct: Product = {
  id: 1,
  name: 'stub name',
  price: 12345,
  description: 'stub description',
  color: 'blue',
  material: 'cotton',
};

const stubOrderId = 123;

jest.mock('../../src/client/api', () => {
  return {
    ExampleApi: jest.fn().mockImplementation(() => {
      return {
        getProducts: jest.fn().mockResolvedValue({ data: [] }),
        checkout: jest.fn().mockResolvedValue({ data: { id: stubOrderId } }),
      };
    }),
    CartApi: jest.fn().mockImplementation(() => {
      return {
        getState: jest.fn(() => ({})),
        setState: jest.fn(),
      };
    }),
  };
});

describe('Store', () => {
  const mockApi = new ExampleApi('/hw/store');
  const mockCart = new CartApi();
  const store = initStore(mockApi, mockCart);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('должен запросить список товаров', () => {
    store.dispatch(productsLoad());

    const result = store.getState();

    expect(mockApi.getProducts).toBeCalledTimes(1);
    expect(result.products).toBeUndefined();
  });

  it('должен добавить товар в корзину', () => {
    store.dispatch(addToCart(stubProduct));

    const result = store.getState();

    expect(result.cart).toEqual({
      [stubProduct.id]: {
        name: stubProduct.name,
        count: 1,
        price: stubProduct.price,
      },
    });
    expect(result.latestOrderId).toBeUndefined();
    expect(mockCart.setState).toBeCalledTimes(1);
  });

  it('должна отчистить корзину', () => {
    store.dispatch(addToCart(stubProduct));
    store.dispatch(clearCart());

    const result = store.getState();

    expect(result.cart).toEqual({});
    expect(result.latestOrderId).toBeUndefined();
    expect(mockCart.setState).toBeCalledTimes(2);
  });

  it('должен оформить заказ', () => {
    store.dispatch(checkout({} as any, store.getState().cart));

    expect(mockApi.checkout).toBeCalledTimes(1);
  });

  it('должна отчистить корчину после оформления заказа', () => {
    store.dispatch(addToCart(stubProduct));
    store.dispatch(checkoutComplete(stubOrderId));

    const result = store.getState();

    expect(result.cart).toEqual({});
    expect(result.latestOrderId).toBe(stubOrderId);
    expect(mockCart.setState).toBeCalledTimes(2);
  });
});
