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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart= [...cart];

      const product = newCart.find((value, index) => value.id===productId)

      const stocksInfo = await api.get(`/stock/${productId}`);
      const stockData : Stock = stocksInfo.data;
      const stockAmount = stockData.amount;
      
      const currentAmount = product? product.amount :0;
      const amount = currentAmount+1;

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(product){
        product.amount=amount;
      }else{
        const newProduct = await api.get(`/products/${productId}`)
        const newInstance = {
          ...newProduct.data,
          amount:1,
        }
        newCart.push(newInstance);
      }
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch(e) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const aux = [...cart];
      const exist = aux.findIndex((value)=> value.id===productId);
      if(exist>=0){
        aux.splice(exist,1);
        setCart(aux);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(aux));
    }else{
      throw Error();
    }
    } catch(e) {
      console.log("erro");
      toast.error('Erro na remoção do produto');
      }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <=0) return;
      const productStockInfo = await api.get(`/stock/${productId}`);
      const stockAmount = productStockInfo.data.amount;
      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      const newArr = [...cart];
      const finded= newArr.find((value)=> value.id===productId);
      if(finded){
        finded.amount = amount;
        setCart(newArr);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newArr));
      }else{
        throw Error();
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
