import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const ElementosCtx = createContext(null);

export function ElementosProvider({ children }) {
  const [elementos, setElementos] = useState(0);
  const [esPro,     setEsPro]     = useState(false);
  const [userId,    setUserId]    = useState(null);
  const [isLoggedIn,setIsLoggedIn]= useState(false);

  const sincronizar = useCallback(async (uid) => {
    if (!uid) return;
    const { data } = await supabase
      .from('perfiles')
      .select('elementos, elementos_reset_at, es_pro')
      .eq('id', uid)
      .maybeSingle();
    if (!data) return;

    let qty = data.elementos ?? 3;
    const resetAt = data.elementos_reset_at ? new Date(data.elementos_reset_at) : null;
    const ahora   = new Date();

    // Top-up diario: si pasaron 24h, asegura mínimo 3 elementos
    if (!resetAt || (ahora - resetAt) >= 24 * 60 * 60 * 1000) {
      qty = Math.max(qty, 3);
      await supabase.from('perfiles').update({
        elementos: qty,
        elementos_reset_at: ahora.toISOString(),
      }).eq('id', uid);
    }

    setElementos(qty);
    setEsPro(!!data.es_pro);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data?.session?.user?.id || null;
      setUserId(uid);
      setIsLoggedIn(!!uid);
      if (uid) sincronizar(uid).catch(console.error);
    }).catch(console.error);

    const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      setIsLoggedIn(!!uid);
      if (uid) sincronizar(uid).catch(console.error);
      else { setElementos(0); setEsPro(false); }
    });
    return () => authListener?.subscription?.unsubscribe();
  }, [sincronizar]);

  const deducir = useCallback(async () => {
    if (!userId) return false;
    if (esPro)   return true;
    if (elementos <= 0) return false;
    const nuevo = elementos - 1;
    setElementos(nuevo);
    await supabase.from('perfiles').update({ elementos: nuevo }).eq('id', userId);
    return true;
  }, [userId, esPro, elementos]);

  const agregar = useCallback(async (cantidad) => {
    if (!userId) return;
    const nuevo = elementos + cantidad;
    setElementos(nuevo);
    await supabase.from('perfiles').update({ elementos: nuevo }).eq('id', userId);
  }, [userId, elementos]);

  const activarPro = useCallback(async () => {
    if (!userId) return;
    setEsPro(true);
    await supabase.from('perfiles').update({ es_pro: true }).eq('id', userId);
  }, [userId]);

  return (
    <ElementosCtx.Provider value={{ elementos, esPro, isLoggedIn, userId, deducir, agregar, activarPro }}>
      {children}
    </ElementosCtx.Provider>
  );
}

export const useElementos = () => useContext(ElementosCtx);
