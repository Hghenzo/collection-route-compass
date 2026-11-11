export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          changes: Json
          created_at: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          changes?: Json
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          changes?: Json
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_settings: {
        Row: {
          id: string
          low_volume_max: number | null
          medium_volume_max: number | null
          singleton: boolean
          updated_at: string
          updated_by: string
        }
        Insert: {
          id?: string
          low_volume_max?: number | null
          medium_volume_max?: number | null
          singleton?: boolean
          updated_at?: string
          updated_by?: string
        }
        Update: {
          id?: string
          low_volume_max?: number | null
          medium_volume_max?: number | null
          singleton?: boolean
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_stores: {
        Row: {
          created_at: string
          created_by: string
          duplicate_justification: string | null
          full_address_snapshot: string
          id: string
          needs_extra_route: boolean
          needs_support: boolean
          notes: string
          planning_id: string
          predicted_volume: number
          priority: Database["public"]["Enums"]["operational_priority"]
          region_snapshot: string
          route_id: string | null
          status: Database["public"]["Enums"]["collection_status"]
          store_code_snapshot: string
          store_id: string
          store_name_snapshot: string
          support_type: Database["public"]["Enums"]["support_type"] | null
          updated_at: string
          updated_by: string
          volume_class: Database["public"]["Enums"]["volume_class"] | null
        }
        Insert: {
          created_at?: string
          created_by?: string
          duplicate_justification?: string | null
          full_address_snapshot?: string
          id?: string
          needs_extra_route?: boolean
          needs_support?: boolean
          notes?: string
          planning_id: string
          predicted_volume?: number
          priority?: Database["public"]["Enums"]["operational_priority"]
          region_snapshot?: string
          route_id?: string | null
          status?: Database["public"]["Enums"]["collection_status"]
          store_code_snapshot: string
          store_id: string
          store_name_snapshot: string
          support_type?: Database["public"]["Enums"]["support_type"] | null
          updated_at?: string
          updated_by?: string
          volume_class?: Database["public"]["Enums"]["volume_class"] | null
        }
        Update: {
          created_at?: string
          created_by?: string
          duplicate_justification?: string | null
          full_address_snapshot?: string
          id?: string
          needs_extra_route?: boolean
          needs_support?: boolean
          notes?: string
          planning_id?: string
          predicted_volume?: number
          priority?: Database["public"]["Enums"]["operational_priority"]
          region_snapshot?: string
          route_id?: string | null
          status?: Database["public"]["Enums"]["collection_status"]
          store_code_snapshot?: string
          store_id?: string
          store_name_snapshot?: string
          support_type?: Database["public"]["Enums"]["support_type"] | null
          updated_at?: string
          updated_by?: string
          volume_class?: Database["public"]["Enums"]["volume_class"] | null
        }
        Relationships: [
          {
            foreignKeyName: "planning_stores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_stores_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "plannings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_stores_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_stores_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_stores_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plannings: {
        Row: {
          collection_date: string
          created_at: string
          created_by: string
          id: string
          notes: string
          shift: Database["public"]["Enums"]["work_shift"]
          status: Database["public"]["Enums"]["collection_status"]
          updated_at: string
        }
        Insert: {
          collection_date: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string
          shift: Database["public"]["Enums"]["work_shift"]
          status?: Database["public"]["Enums"]["collection_status"]
          updated_at?: string
        }
        Update: {
          collection_date?: string
          created_at?: string
          created_by?: string
          id?: string
          notes?: string
          shift?: Database["public"]["Enums"]["work_shift"]
          status?: Database["public"]["Enums"]["collection_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plannings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          email?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          archived: boolean
          capacity_packages: number | null
          code: string
          created_at: string
          created_by: string
          id: string
          needs_extra_route: boolean
          needs_support: boolean
          notes: string
          planning_id: string
          responsible: string
          status: Database["public"]["Enums"]["collection_status"]
          updated_at: string
          vehicle: string
        }
        Insert: {
          archived?: boolean
          capacity_packages?: number | null
          code: string
          created_at?: string
          created_by?: string
          id?: string
          needs_extra_route?: boolean
          needs_support?: boolean
          notes?: string
          planning_id: string
          responsible?: string
          status?: Database["public"]["Enums"]["collection_status"]
          updated_at?: string
          vehicle?: string
        }
        Update: {
          archived?: boolean
          capacity_packages?: number | null
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          needs_extra_route?: boolean
          needs_support?: boolean
          notes?: string
          planning_id?: string
          responsible?: string
          status?: Database["public"]["Enums"]["collection_status"]
          updated_at?: string
          vehicle?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_planning_id_fkey"
            columns: ["planning_id"]
            isOneToOne: false
            referencedRelation: "plannings"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          active: boolean
          city: string
          cluster: string | null
          complement: string
          created_at: string
          created_by: string
          fixed_notes: string
          full_address: string
          id: string
          latitude: number | null
          location_reference: string
          longitude: number | null
          name: string
          region: string
          store_code: string
          street: string
          street_number: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          city?: string
          cluster?: string | null
          complement?: string
          created_at?: string
          created_by?: string
          fixed_notes?: string
          full_address?: string
          id?: string
          latitude?: number | null
          location_reference?: string
          longitude?: number | null
          name: string
          region?: string
          store_code: string
          street?: string
          street_number?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          city?: string
          cluster?: string | null
          complement?: string
          created_at?: string
          created_by?: string
          fixed_notes?: string
          full_address?: string
          id?: string
          latitude?: number | null
          location_reference?: string
          longitude?: number | null
          name?: string
          region?: string
          store_code?: string
          street?: string
          street_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_route: {
        Args: { _archived: boolean; _id: string }
        Returns: undefined
      }
      confirm_planning: { Args: { _id: string }; Returns: undefined }
      copy_planning: {
        Args: {
          _date: string
          _shift: Database["public"]["Enums"]["work_shift"]
          _source: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      import_first_mile: {
        Args: {
          _create_new: boolean
          _date: string
          _rows: Json
          _shift: Database["public"]["Enums"]["work_shift"]
          _update_existing: boolean
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "planner"
      collection_status:
        | "nao_planejada"
        | "planejada"
        | "confirmada"
        | "em_andamento"
        | "concluida"
        | "com_problema"
      operational_priority: "baixa" | "normal" | "alta" | "critica"
      support_type:
        | "veiculo_extra"
        | "outra_rota"
        | "equipe_adicional"
        | "outro"
      volume_class: "baixo" | "medio" | "alto"
      work_shift: "manha" | "tarde" | "noite"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "planner"],
      collection_status: [
        "nao_planejada",
        "planejada",
        "confirmada",
        "em_andamento",
        "concluida",
        "com_problema",
      ],
      operational_priority: ["baixa", "normal", "alta", "critica"],
      support_type: [
        "veiculo_extra",
        "outra_rota",
        "equipe_adicional",
        "outro",
      ],
      volume_class: ["baixo", "medio", "alto"],
      work_shift: ["manha", "tarde", "noite"],
    },
  },
} as const
