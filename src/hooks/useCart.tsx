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
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productCartExists = updatedCart.find(product => product.id === productId)

      const stock = await api.get(`/stock/${productId}`)
      const stockProduc = stock.data.amount

      const currentCartAmount = productCartExists ? productCartExists.amount : 0
      const newCartAmount = currentCartAmount + 1

      if(newCartAmount > stockProduc) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      if(productCartExists){
        productCartExists.amount = newCartAmount
      }
      else{
        const product = await api.get(`/products/${productId}`)
        const newCartProduct = {
          ...product.data,
          amount: 1
        }
        updatedCart.push(newCartProduct)
      }
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removedProductCart = [...cart]
      const productIndex = removedProductCart.findIndex(product => product.id === productId)
      if(productIndex !== -1) {
        removedProductCart.splice(productIndex, 1)
        setCart(removedProductCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(removedProductCart))
      }
      else{
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api.get(`/stock/${productId}`)
      const stockProduc = stock.data.amount

      if(amount > stockProduc){
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      if(amount < 1){
        toast.error('Quantidade solicitada fora de estoque')
        return
      }      

      const updatedCart = [...cart]
      const productCartExists = updatedCart.find(product => product.id === productId) 
      if(productCartExists){
        productCartExists.amount = amount
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }
      else{
        throw Error()
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
