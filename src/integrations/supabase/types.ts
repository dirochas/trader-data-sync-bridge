export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          account: string
          balance: number
          broker: string | null
          created_at: string
          deleted_at: string | null
          equity: number
          id: string
          leverage: number
          name: string | null
          profit: number
          server: string
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_email: string | null
          vps_unique_id: string | null
        }
        Insert: {
          account: string
          balance?: number
          broker?: string | null
          created_at?: string
          deleted_at?: string | null
          equity?: number
          id?: string
          leverage?: number
          name?: string | null
          profit?: number
          server: string
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_email?: string | null
          vps_unique_id?: string | null
        }
        Update: {
          account?: string
          balance?: number
          broker?: string | null
          created_at?: string
          deleted_at?: string | null
          equity?: number
          id?: string
          leverage?: number
          name?: string | null
          profit?: number
          server?: string
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_email?: string | null
          vps_unique_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_vps_unique_id_fkey"
            columns: ["vps_unique_id"]
            isOneToOne: false
            referencedRelation: "vps_servers"
            referencedColumns: ["vps_unique_id"]
          },
        ]
      }
      commands: {
        Row: {
          account_id: string
          created_at: string
          data: Json | null
          error: string | null
          executed: string | null
          id: string
          status: string
          type: string
        }
        Insert: {
          account_id: string
          created_at?: string
          data?: Json | null
          error?: string | null
          executed?: string | null
          id?: string
          status?: string
          type: string
        }
        Update: {
          account_id?: string
          created_at?: string
          data?: Json | null
          error?: string | null
          executed?: string | null
          id?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "commands_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_advisors: {
        Row: {
          created_at: string
          description: string | null
          download_count: number | null
          ex4_file_path: string | null
          ex5_file_path: string | null
          id: string
          name: string
          updated_at: string
          uploaded_by: string
          uploader_role: Database["public"]["Enums"]["user_role"]
          version: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          download_count?: number | null
          ex4_file_path?: string | null
          ex5_file_path?: string | null
          id?: string
          name: string
          updated_at?: string
          uploaded_by: string
          uploader_role: Database["public"]["Enums"]["user_role"]
          version: string
        }
        Update: {
          created_at?: string
          description?: string | null
          download_count?: number | null
          ex4_file_path?: string | null
          ex5_file_path?: string | null
          id?: string
          name?: string
          updated_at?: string
          uploaded_by?: string
          uploader_role?: Database["public"]["Enums"]["user_role"]
          version?: string
        }
        Relationships: []
      }
      hedge_simulations: {
        Row: {
          account_size: number
          additional_deposit_f2: number | null
          calculated_at: string | null
          created_at: string
          extra_hedge_amount_f1: number | null
          extra_hedge_amount_f2: number | null
          extra_hedge_amount_funded: number | null
          final_balance_real_account_f1_fail: number | null
          final_balance_real_account_f2_fail: number | null
          funded_target_amount: number | null
          id: string
          implementation_status: string | null
          max_dd_pct: number
          min_real_deposit_f1: number | null
          min_real_deposit_f2: number | null
          min_real_deposit_funded: number | null
          notes: string | null
          phase_cost_f1: number | null
          phase_cost_f2: number | null
          phase_cost_funded: number | null
          profit_division_pct: number
          profit_projection_f1: number | null
          profit_projection_f2: number | null
          profit_projection_funded: number | null
          propfirm_breakeven: number | null
          ratio_f1: number | null
          ratio_f2: number | null
          ratio_funded: number | null
          recovery_amount_f1: number | null
          recovery_amount_f2: number | null
          recovery_amount_funded: number | null
          remaining_balance_f1: number | null
          remaining_balance_f2: number | null
          roi_percentage: number | null
          safety_multiplier_f1: number | null
          safety_multiplier_f2: number | null
          safety_multiplier_funded: number | null
          simulation_name: string | null
          target_pct_f1: number
          target_pct_f2: number
          test_cost: number
          test_refund: boolean | null
          test_refund_amount: number | null
          total_profit: number | null
          total_test_cost: number | null
          total_used: number | null
          total_withdraw: number | null
          trader_profit_share: number | null
          updated_at: string | null
        }
        Insert: {
          account_size?: number
          additional_deposit_f2?: number | null
          calculated_at?: string | null
          created_at?: string
          extra_hedge_amount_f1?: number | null
          extra_hedge_amount_f2?: number | null
          extra_hedge_amount_funded?: number | null
          final_balance_real_account_f1_fail?: number | null
          final_balance_real_account_f2_fail?: number | null
          funded_target_amount?: number | null
          id?: string
          implementation_status?: string | null
          max_dd_pct?: number
          min_real_deposit_f1?: number | null
          min_real_deposit_f2?: number | null
          min_real_deposit_funded?: number | null
          notes?: string | null
          phase_cost_f1?: number | null
          phase_cost_f2?: number | null
          phase_cost_funded?: number | null
          profit_division_pct?: number
          profit_projection_f1?: number | null
          profit_projection_f2?: number | null
          profit_projection_funded?: number | null
          propfirm_breakeven?: number | null
          ratio_f1?: number | null
          ratio_f2?: number | null
          ratio_funded?: number | null
          recovery_amount_f1?: number | null
          recovery_amount_f2?: number | null
          recovery_amount_funded?: number | null
          remaining_balance_f1?: number | null
          remaining_balance_f2?: number | null
          roi_percentage?: number | null
          safety_multiplier_f1?: number | null
          safety_multiplier_f2?: number | null
          safety_multiplier_funded?: number | null
          simulation_name?: string | null
          target_pct_f1?: number
          target_pct_f2?: number
          test_cost?: number
          test_refund?: boolean | null
          test_refund_amount?: number | null
          total_profit?: number | null
          total_test_cost?: number | null
          total_used?: number | null
          total_withdraw?: number | null
          trader_profit_share?: number | null
          updated_at?: string | null
        }
        Update: {
          account_size?: number
          additional_deposit_f2?: number | null
          calculated_at?: string | null
          created_at?: string
          extra_hedge_amount_f1?: number | null
          extra_hedge_amount_f2?: number | null
          extra_hedge_amount_funded?: number | null
          final_balance_real_account_f1_fail?: number | null
          final_balance_real_account_f2_fail?: number | null
          funded_target_amount?: number | null
          id?: string
          implementation_status?: string | null
          max_dd_pct?: number
          min_real_deposit_f1?: number | null
          min_real_deposit_f2?: number | null
          min_real_deposit_funded?: number | null
          notes?: string | null
          phase_cost_f1?: number | null
          phase_cost_f2?: number | null
          phase_cost_funded?: number | null
          profit_division_pct?: number
          profit_projection_f1?: number | null
          profit_projection_f2?: number | null
          profit_projection_funded?: number | null
          propfirm_breakeven?: number | null
          ratio_f1?: number | null
          ratio_f2?: number | null
          ratio_funded?: number | null
          recovery_amount_f1?: number | null
          recovery_amount_f2?: number | null
          recovery_amount_funded?: number | null
          remaining_balance_f1?: number | null
          remaining_balance_f2?: number | null
          roi_percentage?: number | null
          safety_multiplier_f1?: number | null
          safety_multiplier_f2?: number | null
          safety_multiplier_funded?: number | null
          simulation_name?: string | null
          target_pct_f1?: number
          target_pct_f2?: number
          test_cost?: number
          test_refund?: boolean | null
          test_refund_amount?: number | null
          total_profit?: number | null
          total_test_cost?: number | null
          total_used?: number | null
          total_withdraw?: number | null
          trader_profit_share?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      history: {
        Row: {
          account_id: string | null
          close: number
          close_time: string
          created_at: string
          id: string
          price: number
          profit: number
          symbol: string
          ticket: number
          time: string
          type: string
          volume: number
        }
        Insert: {
          account_id?: string | null
          close: number
          close_time: string
          created_at?: string
          id?: string
          price: number
          profit?: number
          symbol: string
          ticket: number
          time: string
          type: string
          volume: number
        }
        Update: {
          account_id?: string | null
          close?: number
          close_time?: string
          created_at?: string
          id?: string
          price?: number
          profit?: number
          symbol?: string
          ticket?: number
          time?: string
          type?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      margin: {
        Row: {
          account_id: string | null
          created_at: string
          free: number
          id: string
          level: number
          updated_at: string
          used: number
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          free?: number
          id?: string
          level?: number
          updated_at?: string
          used?: number
        }
        Update: {
          account_id?: string | null
          created_at?: string
          free?: number
          id?: string
          level?: number
          updated_at?: string
          used?: number
        }
        Relationships: [
          {
            foreignKeyName: "margin_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          account_id: string | null
          created_at: string
          current: number
          id: string
          price: number
          profit: number
          symbol: string
          ticket: number
          time: string
          type: string
          updated_at: string
          volume: number
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          current: number
          id?: string
          price: number
          profit?: number
          symbol: string
          ticket: number
          time: string
          type: string
          updated_at?: string
          volume: number
        }
        Update: {
          account_id?: string | null
          created_at?: string
          current?: number
          id?: string
          price?: number
          profit?: number
          symbol?: string
          ticket?: number
          time?: string
          type?: string
          updated_at?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "positions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          last_login: string | null
          last_name: string | null
          nickname: string | null
          notes: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          is_active?: boolean
          last_login?: string | null
          last_name?: string | null
          nickname?: string | null
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_login?: string | null
          last_name?: string | null
          nickname?: string | null
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          activated_at: string | null
          created_at: string
          id: string
          setting_key: string
          setting_value: boolean
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: boolean
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      vps_servers: {
        Row: {
          cost: number | null
          created_at: string
          display_name: string
          due_date: string | null
          host: string | null
          id: string
          password: string | null
          port: string | null
          updated_at: string
          username: string | null
          vps_unique_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          display_name: string
          due_date?: string | null
          host?: string | null
          id?: string
          password?: string | null
          port?: string | null
          updated_at?: string
          username?: string | null
          vps_unique_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          display_name?: string
          due_date?: string | null
          host?: string | null
          id?: string
          password?: string | null
          port?: string | null
          updated_at?: string
          username?: string | null
          vps_unique_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      is_admin_or_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      account_status: "active" | "archived" | "deleted"
      user_role: "admin" | "manager" | "client_trader" | "client_investor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "archived", "deleted"],
      user_role: ["admin", "manager", "client_trader", "client_investor"],
    },
  },
} as const
