import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    if (storagedCart) {
      return JSON.parse(storagedCart)
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productAlreadyInCart = cart.find(product => product.id === productId)

      const stockResponse = await api.get<Stock>(`stock/${productId}`)
      const amountInStock = stockResponse.data.amount
      const amountToBeAdded = productAlreadyInCart ? productAlreadyInCart.amount : 0

      if(amountInStock === amountToBeAdded) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      if(productAlreadyInCart) {
        productAlreadyInCart.amount = amountToBeAdded + 1
      } else {
        const productResponse = await api.get<Product>(`products/${productId}`)
        const product = productResponse.data
        const newProduct = {...product, amount: 1}

        updatedCart.push(newProduct)
      }

      
      setCart(updatedCart)
      const forStorage = JSON.stringify(updatedCart)
      localStorage.setItem('@RocketShoes:cart', forStorage)
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId)
      if(!productExists) {
        toast.error('Erro na remoção do produto')
        return
      }

      const updatedCart = cart.filter(product => product.id !== productId)
      setCart(updatedCart)

      const forStorage = JSON.stringify(updatedCart)
      localStorage.setItem('@RocketShoes:cart', forStorage)
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedCart = [...cart]
      const stockResponse = await api.get(`stock/${productId}`)
      const amountInStock = stockResponse.data.amount
      
      const productInCart = cart.find(product => product.id === productId)
      if(!productInCart) {
        toast.error('Erro na alteração de quantidade do produto')
        return
      }
      if(amount === 0) {
        toast.error('Erro na alteração de quantidade do produto')
        return
      }
      if(amount > amountInStock && amount > productInCart.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      productInCart.amount = amount
      setCart(updatedCart)

      const forStorage = JSON.stringify(updatedCart)
      localStorage.setItem('@RocketShoes:cart', forStorage)
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
