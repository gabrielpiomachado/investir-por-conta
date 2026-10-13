export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      budgets: {
        Row: {
          alert_thresholds: number[];
          amount: number;
          category_id: string;
          created_at: string;
          id: string;
          period: Database['public']['Enums']['budget_period'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          alert_thresholds?: number[];
          amount: number;
          category_id: string;
          created_at?: string;
          id?: string;
          period: Database['public']['Enums']['budget_period'];
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          alert_thresholds?: number[];
          amount?: number;
          category_id?: string;
          created_at?: string;
          id?: string;
          period?: Database['public']['Enums']['budget_period'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'budgets_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      goals: {
        Row: {
          completed_at: string | null;
          created_at: string;
          current_amount: number;
          id: string;
          name: string;
          status: 'active' | 'completed';
          target_amount: number;
          target_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          current_amount?: number;
          id?: string;
          name: string;
          status?: 'active' | 'completed';
          target_amount: number;
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          current_amount?: number;
          id?: string;
          name?: string;
          status?: 'active' | 'completed';
          target_amount?: number;
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      goal_contributions: {
        Row: {
          amount: number;
          created_at: string;
          description: string | null;
          goal_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          description?: string | null;
          goal_id: string;
          id?: string;
          user_id?: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          description?: string | null;
          goal_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'goal_contributions_goal_owner_fkey';
            columns: ['goal_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'goals';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      categories: {
        Row: {
          category_type: Database['public']['Enums']['category_type'];
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category_type: Database['public']['Enums']['category_type'];
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          category_type?: Database['public']['Enums']['category_type'];
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      recurring_transactions: {
        Row: {
          amount: number;
          category_id: string;
          created_at: string;
          description: string | null;
          frequency: 'daily' | 'weekly' | 'monthly';
          id: string;
          is_active: boolean;
          monthly_anchor_day: number;
          next_run_date: string;
          start_date: string;
          transaction_type: Database['public']['Enums']['category_type'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id: string;
          created_at?: string;
          description?: string | null;
          frequency: 'daily' | 'weekly' | 'monthly';
          id?: string;
          is_active?: boolean;
          monthly_anchor_day: number;
          next_run_date: string;
          start_date: string;
          transaction_type: Database['public']['Enums']['category_type'];
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          amount?: number;
          category_id?: string;
          created_at?: string;
          description?: string | null;
          frequency?: 'daily' | 'weekly' | 'monthly';
          id?: string;
          is_active?: boolean;
          monthly_anchor_day?: number;
          next_run_date?: string;
          start_date?: string;
          transaction_type?: Database['public']['Enums']['category_type'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_transactions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      transactions: {
        Row: {
          amount: number;
          category_id: string;
          created_at: string;
          description: string | null;
          id: string;
          recurrence_occurrence_date: string | null;
          recurring_transaction_id: string | null;
          transaction_date: string;
          transaction_type: Database['public']['Enums']['category_type'];
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          recurrence_occurrence_date?: string | null;
          recurring_transaction_id?: string | null;
          transaction_date: string;
          transaction_type: Database['public']['Enums']['category_type'];
          user_id?: string;
        };
        Update: {
          amount?: number;
          category_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          recurrence_occurrence_date?: string | null;
          recurring_transaction_id?: string | null;
          transaction_date?: string;
          transaction_type?: Database['public']['Enums']['category_type'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_recurrence_owner_fkey';
            columns: ['recurring_transaction_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'recurring_transactions';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cancel_goal: {
        Args: { p_goal_id: string };
        Returns: undefined;
      };
      contribute_to_goal: {
        Args: {
          p_amount: number;
          p_description?: string | null;
          p_goal_id: string;
        };
        Returns: undefined;
      };
      create_goal: {
        Args: {
          p_name: string;
          p_target_amount: number;
          p_target_date?: string | null;
        };
        Returns: string;
      };
      get_consolidated_balance: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      generate_due_recurring_transactions: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      update_goal: {
        Args: {
          p_goal_id: string;
          p_name: string;
          p_target_amount: number;
          p_target_date?: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      budget_period: 'monthly' | 'annual';
      category_type: 'income' | 'expense';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      category_type: ['income', 'expense'],
    },
  },
} as const;
