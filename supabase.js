import { createClient } from '@supabase/supabase-js';

// ENDEREÇO DO NOSSO PROJETO NO SUPABASE
const SUPABASE_URL = 'https://pufbnxjpoalxqaxjjabl.supabase.co';

// CHAVE PÚBLICA DE ACESSO (para projetos de estudo é ok deixar aqui)
const SUPABASE_KEY = 'sb_publishable_hak1D_SPG2ypVgXSbS5oLA_Yp-EMwBD';

// cria e exporta o cliente — é ele que usamos no App.js para ler, salvar e excluir dados
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
