// ============================================
// CryptoDash - Supabase Integration
// Sincronização em nuvem segura
// ============================================

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { encryptionService } from '../utils/encryption';
import type { PortfolioItem, AlertItem, UserSettings } from '../types/index';

// Configuração - Substitua pelos seus valores do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export interface CloudSyncData {
  portfolio: PortfolioItem[];
  alerts: AlertItem[];
  favorites: string[];
  settings: UserSettings;
}

export class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient | null = null;
  private currentUser: User | null = null;

  private constructor() {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
      this.initializeAuth();
    }
  }

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  /**
   * Verifica se Supabase está configurado
   */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Inicializa estado de autenticação
   */
  private async initializeAuth(): Promise<void> {
    if (!this.client) return;

    // Verifica sessão existente
    const { data: { session } } = await this.client.auth.getSession();
    if (session?.user) {
      this.currentUser = session.user;
    }

    // Escuta mudanças de auth
    this.client.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user || null;
      
      if (event === 'SIGNED_IN') {
        window.dispatchEvent(new CustomEvent('cloud:signedin'));
      } else if (event === 'SIGNED_OUT') {
        window.dispatchEvent(new CustomEvent('cloud:signedout'));
      }
    });
  }

  /**
   * Registra novo usuário
   */
  async signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    if (!this.client) {
      return { user: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await this.client.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  }

  /**
   * Login
   */
  async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    if (!this.client) {
      return { user: null, error: new Error('Supabase not configured') };
    }

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error };
    }

    this.currentUser = data.user;
    return { user: data.user, error: null };
  }

  /**
   * Logout
   */
  async signOut(): Promise<{ error: Error | null }> {
    if (!this.client) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await this.client.auth.signOut();
    if (!error) {
      this.currentUser = null;
    }

    return { error };
  }

  /**
   * Retorna usuário atual
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Verifica se está logado
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Sincroniza dados para nuvem (criptografados)
   */
  async syncToCloud(data: CloudSyncData): Promise<{ success: boolean; error: Error | null }> {
    if (!this.client || !this.currentUser) {
      return { success: false, error: new Error('Not authenticated') };
    }

    try {
      // Criptografa os dados antes de enviar
      const encrypted = encryptionService.encrypt(data);
      const deviceId = this.getDeviceId();

      const { error } = await this.client
        .from('user_data')
        .upsert({
          user_id: this.currentUser.id,
          encrypted_data: JSON.stringify(encrypted),
          device_id: deviceId,
          last_sync: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      window.dispatchEvent(new CustomEvent('cloud:synced', { detail: { direction: 'up' } }));
      return { success: true, error: null };
    } catch (error) {
      console.error('Sync to cloud failed:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Recupera dados da nuvem
   */
  async syncFromCloud(): Promise<{ data: CloudSyncData | null; error: Error | null }> {
    if (!this.client || !this.currentUser) {
      return { data: null, error: new Error('Not authenticated') };
    }

    try {
      const { data, error } = await this.client
        .from('user_data')
        .select('encrypted_data, last_sync')
        .eq('user_id', this.currentUser.id)
        .single();

      if (error) throw error;
      if (!data) return { data: null, error: null };

      // Descriptografa os dados
      const encrypted = JSON.parse(data.encrypted_data);
      const decrypted = encryptionService.decrypt<CloudSyncData>(encrypted);

      if (!decrypted) {
        throw new Error('Failed to decrypt data');
      }

      window.dispatchEvent(new CustomEvent('cloud:synced', { detail: { direction: 'down', timestamp: data.last_sync } }));
      return { data: decrypted, error: null };
    } catch (error) {
      console.error('Sync from cloud failed:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Auto-sync quando online
   */
  async autoSync(localData: CloudSyncData): Promise<void> {
    if (!this.isConfigured() || !this.isAuthenticated()) return;

    // Sobe dados locais
    await this.syncToCloud(localData);

    // Baixa dados da nuvem (merge inteligente pode ser implementado)
    const { data: cloudData } = await this.syncFromCloud();
    
    if (cloudData) {
      // Dispara evento para aplicação fazer merge
      window.dispatchEvent(new CustomEvent('cloud:datareceived', { detail: cloudData }));
    }
  }

  /**
   * Gera/Recupera ID único do dispositivo
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('cd_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('cd_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Configura tabela no Supabase (chamada única)
   * SQL para criar tabela:
   * 
   * CREATE TABLE user_data (
   *   user_id UUID PRIMARY KEY REFERENCES auth.users(id),
   *   encrypted_data TEXT NOT NULL,
   *   device_id TEXT,
   *   last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   * );
   * 
   * -- RLS Policy
   * ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
   * 
   * CREATE POLICY "Users can only access their own data"
   *   ON user_data
   *   FOR ALL
   *   USING (auth.uid() = user_id);
   */
}

// Export singleton
export const supabaseService = SupabaseService.getInstance();

// Hook para reactividade
export function useCloudSync() {
  return {
    isConfigured: supabaseService.isConfigured(),
    isAuthenticated: supabaseService.isAuthenticated(),
    user: supabaseService.getCurrentUser(),
    signIn: supabaseService.signIn.bind(supabaseService),
    signUp: supabaseService.signUp.bind(supabaseService),
    signOut: supabaseService.signOut.bind(supabaseService),
    syncToCloud: supabaseService.syncToCloud.bind(supabaseService),
    syncFromCloud: supabaseService.syncFromCloud.bind(supabaseService),
  };
}
