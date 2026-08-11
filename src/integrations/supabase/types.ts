export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      companies: {
        Row: {
          address: string | null;
          brand: string | null;
          cargo_details: string | null;
          company_name: string;
          created_at: string;
          email: string | null;
          governorate: string | null;
          granting_license_approval: string | null;
          id: string;
          license_approval_date: string | null;
          license_number: string | null;
          phone: string | null;
          specialization: string | null;
          type_industry_production: string | null;
        };
        Insert: {
          address?: string | null;
          brand?: string | null;
          cargo_details?: string | null;
          company_name: string;
          created_at?: string;
          email?: string | null;
          governorate?: string | null;
          granting_license_approval?: string | null;
          id?: string;
          license_approval_date?: string | null;
          license_number?: string | null;
          phone?: string | null;
          specialization?: string | null;
          type_industry_production?: string | null;
        };
        Update: {
          address?: string | null;
          brand?: string | null;
          cargo_details?: string | null;
          company_name?: string;
          created_at?: string;
          email?: string | null;
          governorate?: string | null;
          granting_license_approval?: string | null;
          id?: string;
          license_approval_date?: string | null;
          license_number?: string | null;
          phone?: string | null;
          specialization?: string | null;
          type_industry_production?: string | null;
        };
        Relationships: [];
      };
      document_items: {
        Row: {
          created_at: string;
          document_id: string;
          id: string;
          item_name: string;
          production_capacity: string | null;
          unit: string;
        };
        Insert: {
          created_at?: string;
          document_id: string;
          id?: string;
          item_name: string;
          production_capacity?: string | null;
          unit?: string;
        };
        Update: {
          created_at?: string;
          document_id?: string;
          id?: string;
          item_name?: string;
          production_capacity?: string | null;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_items_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          brand: string | null;
          cargo_typedetails: string | null;
          checkpoint_name_control: string | null;
          company_id: string;
          company_name: string;
          company_name_project: string | null;
          created_at: string;
          created_by: string | null;
          destination_governorate: string | null;
          document_number: string;
          document_value: number;
          driver_name: string | null;
          governorate_name: string | null;
          granting_license_approval: string | null;
          id: string;
          licence_number: string | null;
          license_approval_date: string | null;
          license_approval_number: string | null;
          license_text_specialization: string | null;
          notes: string | null;
          qr_code_data: string | null;
          registration_governorate: string | null;
          status: string;
          subject: string | null;
          trader_id: string | null;
          type_industry_production: string | null;
          vehicle_number: string | null;
          weight_quantity: string | null;
          x_coordinate: string | null;
          y_coordinate: string | null;
        };
        Insert: {
          brand?: string | null;
          cargo_typedetails?: string | null;
          checkpoint_name_control?: string | null;
          company_id: string;
          company_name: string;
          company_name_project?: string | null;
          created_at?: string;
          created_by?: string | null;
          destination_governorate?: string | null;
          document_number?: string;
          document_value?: number;
          driver_name?: string | null;
          governorate_name?: string | null;
          granting_license_approval?: string | null;
          id?: string;
          licence_number?: string | null;
          license_approval_date?: string | null;
          license_approval_number?: string | null;
          license_text_specialization?: string | null;
          notes?: string | null;
          qr_code_data?: string | null;
          registration_governorate?: string | null;
          status?: string;
          subject?: string | null;
          trader_id?: string | null;
          type_industry_production?: string | null;
          vehicle_number?: string | null;
          weight_quantity?: string | null;
          x_coordinate?: string | null;
          y_coordinate?: string | null;
        };
        Update: {
          brand?: string | null;
          cargo_typedetails?: string | null;
          checkpoint_name_control?: string | null;
          company_id?: string;
          company_name?: string;
          company_name_project?: string | null;
          created_at?: string;
          created_by?: string | null;
          destination_governorate?: string | null;
          document_number?: string;
          document_value?: number;
          driver_name?: string | null;
          governorate_name?: string | null;
          granting_license_approval?: string | null;
          id?: string;
          licence_number?: string | null;
          license_approval_date?: string | null;
          license_approval_number?: string | null;
          license_text_specialization?: string | null;
          notes?: string | null;
          qr_code_data?: string | null;
          registration_governorate?: string | null;
          status?: string;
          subject?: string | null;
          trader_id?: string | null;
          type_industry_production?: string | null;
          vehicle_number?: string | null;
          weight_quantity?: string | null;
          x_coordinate?: string | null;
          y_coordinate?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_trader_id_fkey";
            columns: ["trader_id"];
            isOneToOne: false;
            referencedRelation: "traders";
            referencedColumns: ["id"];
          },
        ];
      };
      traders: {
        Row: {
          address: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          cargo_typedetails: string | null;
          company_id: string;
          created_at: string;
          created_by: string | null;
          description: string | null;
          document_id: string | null;
          document_number: string | null;
          driver_name: string | null;
          id: string;
          trader_id: string | null;
          type: string;
        };
        Insert: {
          amount?: number;
          cargo_typedetails?: string | null;
          company_id: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          document_id?: string | null;
          document_number?: string | null;
          driver_name?: string | null;
          id?: string;
          trader_id?: string | null;
          type?: string;
        };
        Update: {
          amount?: number;
          cargo_typedetails?: string | null;
          company_id?: string;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          document_id?: string | null;
          document_number?: string | null;
          driver_name?: string | null;
          id?: string;
          trader_id?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_trader_id_fkey";
            columns: ["trader_id"];
            isOneToOne: false;
            referencedRelation: "traders";
            referencedColumns: ["id"];
          },
        ];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          balance: number;
          currency: string;
          status: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          balance?: number;
          currency?: string;
          status?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          balance?: number;
          currency?: string;
          status?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_document_number: { Args: never; Returns: string };
      is_approved_user: { Args: never; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
