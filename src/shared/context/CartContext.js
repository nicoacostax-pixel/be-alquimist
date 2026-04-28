import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    // Recuperar carrito guardado en el navegador
    const savedCart = localStorage.getItem('alquimia_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('alquimia_cart', JSON.stringify(cart));
  }, [cart]);

  const getItemKey = (item) => item?.sku || `${item?.id || 'unknown'}-${item?.presentacion || 'base'}`;

  const addToCart = (producto, variante, cantidad) => {
    setCart(prevCart => {
      const newItem = {
        id: producto.id,
        nombre: producto.nombre,
        imagen: producto.imagen_url,
        precio: Number(variante?.precio || 0),
        sku: variante?.sku || `${producto.id}-${variante?.nombre || 'base'}`,
        presentacion: variante?.nombre || 'Presentación estándar',
        cantidad: Math.max(1, Number(cantidad || 1))
      };
      const itemKey = getItemKey(newItem);
      const itemIndex = prevCart.findIndex((item) => getItemKey(item) === itemKey);
      
      if (itemIndex > -1) {
        const newCart = [...prevCart];
        newCart[itemIndex].cantidad += newItem.cantidad;
        return newCart;
      }
      
      return [...prevCart, newItem];
    });
  };

  const updateQuantity = (itemKey, nextQuantity) => {
    setCart((prevCart) => prevCart
      .map((item) => {
        if (getItemKey(item) !== itemKey) return item;
        return { ...item, cantidad: Math.max(1, Number(nextQuantity || 1)) };
      }));
  };

  const increaseQuantity = (itemKey) => {
    setCart((prevCart) => prevCart
      .map((item) => getItemKey(item) === itemKey
        ? { ...item, cantidad: item.cantidad + 1 }
        : item));
  };

  const decreaseQuantity = (itemKey) => {
    setCart((prevCart) => prevCart
      .map((item) => getItemKey(item) === itemKey
        ? { ...item, cantidad: Math.max(1, item.cantidad - 1) }
        : item));
  };

  const removeFromCart = (itemKey) => {
    setCart((prevCart) => prevCart.filter((item) => getItemKey(item) !== itemKey));
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((total, item) => total + item.cantidad, 0);
  const cartSubtotal = cart.reduce((total, item) => total + (Number(item.precio || 0) * Number(item.cantidad || 0)), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        cartCount,
        cartSubtotal,
        updateQuantity,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        getItemKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);