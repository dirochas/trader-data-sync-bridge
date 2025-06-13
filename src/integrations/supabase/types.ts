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
      margin_info: {
        Row: {
          account_id: string | null
          created_at: string
          free_margin: number
          id: string
          margin_level: number
          updated_at: string
          used_margin: number
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          free_margin?: number
          id?: string
          margin_level?: number
          updated_at?: string
          used_margin?: number
        }
        Update: {
          account_id?: string | null
          created_at?: string
          free_margin?: number
          id?: string
          margin_level?: number
          updated_at?: string
          used_margin?: number
        }
        Relationships: [
          {
            foreignKeyName: "margin_info_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      open_positions: {
        Row: {
          account_id: string | null
          created_at: string
          current_price: number
          id: string
          open_price: number
          open_time: string
          profit: number
          symbol: string
          ticket: number
          type: string
          updated_at: string
          volume: number
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          current_price: number
          id?: string
          open_price: number
          open_time: string
          profit?: number
          symbol: string
          ticket: number
          type: string
          updated_at?: string
          volume: number
        }
        Update: {
          account_id?: string | null
          created_at?: string
          current_price?: number
          id?: string
          open_price?: number
          open_time?: string
          profit?: number
          symbol?: string
          ticket?: number
          type?: string
          updated_at?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "open_positions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_history: {
        Row: {
          account_id: string | null
          close_price: number
          close_time: string
          created_at: string
          id: string
          open_price: number
          open_time: string
          profit: number
          symbol: string
          ticket: number
          type: string
          volume: number
        }
        Insert: {
          account_id?: string | null
          close_price: number
          close_time: string
          created_at?: string
          id?: string
          open_price: number
          open_time: string
          profit?: number
          symbol: string
          ticket: number
          type: string
          volume: number
        }
        Update: {
          account_id?: string | null
          close_price?: number
          close_time?: string
          created_at?: string
          id?: string
          open_price?: number
          open_time?: string
          profit?: number
          symbol?: string
          ticket?: number
          type?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "trade_history_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_accounts: {
        Row: {
          account_number: string
          balance: number
          broker: string | null
          created_at: string
          equity: number
          id: string
          leverage: number
          name: string | null
          profit: number
          server: string
          updated_at: string
          vps_name: string | null
        }
        Insert: {
          account_number: string
          balance?: number
          broker?: string | null
          created_at?: string
          equity?: number
          id?: string
          leverage?: number
          name?: string | null
          profit?: number
          server: string
          updated_at?: string
          vps_name?: string | null
        }
        Update: {
          account_number?: string
          balance?: number
          broker?: string | null
          created_at?: string
          equity?: number
          id?: string
          leverage?: number
          name?: string | null
          profit?: number
          server?: string
          updated_at?: string
          vps_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
