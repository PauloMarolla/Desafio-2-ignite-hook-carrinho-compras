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
      const { data } = await api.get(`stock/${productId}`);
      const productExistis = cart.find(product => product.id === productId);

      if(!productExistis && data.amount > 0) {
       
        const { data } = await api.get<Product>(`products/${productId}`)
    
        setCart([...cart, {...data, amount: 1}])
        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify([...cart, {...data, amount: 1}])
        )
    } else if(productExistis && productExistis.amount <= data.amount) {
      const amount = productExistis.amount +1;
      updateProductAmount({productId, amount})
    } else {
      toast.error('Quantidade solicitada fora de estoque')
    }
    } catch {
      toast.error("Erro na adição de produto")
    }
  };



  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);
    
        let removeCartList = cart.filter(product => product.id !== productId)

        setCart(removeCartList);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(removeCartList))
     
    } catch {
      toast.error('erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get(`stock/${productId}`)
      
      if(amount < 1) {
        toast.error("Não é possivel ter menos que uma quantidade")

      } else if (amount <= data.amount) {
        const newCartList = cart.map(product => 
          productId === product.id ? { ...product, amount } : product)

        setCart(newCartList)

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCartList))
      } else {
        toast.error("Quantidade solicitada fora de estoque")
      }
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
