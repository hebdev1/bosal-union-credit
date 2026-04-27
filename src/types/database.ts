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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string
          account_type: Database["public"]["Enums"]["account_type"]
          balance: number | null
          cooperative_id: string
          created_at: string | null
          currency: string | null
          id: string
          member_id: string
          savings_product_id: string | null
          status: Database["public"]["Enums"]["status_type"] | null
        }
        Insert: {
          account_number: string
          account_type?: Database["public"]["Enums"]["account_type"]
          balance?: number | null
          cooperative_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          member_id: string
          savings_product_id?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Update: {
          account_number?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          balance?: number | null
          cooperative_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          member_id?: string
          savings_product_id?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_with_age"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_savings_product_id_fkey"
            columns: ["savings_product_id"]
            isOneToOne: false
            referencedRelation: "savings_products"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          cooperative_id: string
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["agent_role"]
          status: Database["public"]["Enums"]["status_type"] | null
        }
        Insert: {
          cooperative_id: string
          created_at?: string | null
          email: string
          id: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["agent_role"]
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Update: {
          cooperative_id?: string
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["agent_role"]
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          category: string
          cooperative_id: string
          description: string | null
          id: string
          input_type: string | null
          key: string
          label: string | null
          options: Json | null
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category: string
          cooperative_id: string
          description?: string | null
          id?: string
          input_type?: string | null
          key: string
          label?: string | null
          options?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string
          cooperative_id?: string
          description?: string | null
          id?: string
          input_type?: string | null
          key?: string
          label?: string | null
          options?: Json | null
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string | null
          cooperative_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          target_id: string | null
          target_table: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          cooperative_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          cooperative_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string | null
          cooperative_id: string
          created_at: string | null
          id: string
          manager_agent_id: string | null
          name: string
          phone: string | null
          status: string | null
        }
        Insert: {
          address?: string | null
          cooperative_id: string
          created_at?: string | null
          id?: string
          manager_agent_id?: string | null
          name: string
          phone?: string | null
          status?: string | null
        }
        Update: {
          address?: string | null
          cooperative_id?: string
          created_at?: string | null
          id?: string
          manager_agent_id?: string | null
          name?: string
          phone?: string | null
          status?: string | null
        }
        Relationships: []
      }
      cash_vault: {
        Row: {
          cooperative_id: string | null
          current_balance: number | null
          id: string
          last_updated: string | null
          opening_balance: number | null
        }
        Insert: {
          cooperative_id?: string | null
          current_balance?: number | null
          id?: string
          last_updated?: string | null
          opening_balance?: number | null
        }
        Update: {
          cooperative_id?: string | null
          current_balance?: number | null
          id?: string
          last_updated?: string | null
          opening_balance?: number | null
        }
        Relationships: []
      }
      cooperatives: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["status_type"] | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          cooperative_id: string | null
          created_at: string | null
          id: string
          member_code: string | null
          user_id: string | null
        }
        Insert: {
          cooperative_id?: string | null
          created_at?: string | null
          id?: string
          member_code?: string | null
          user_id?: string | null
        }
        Update: {
          cooperative_id?: string | null
          created_at?: string | null
          id?: string
          member_code?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      daily_closings: {
        Row: {
          branch_id: string | null
          closed_at: string | null
          closed_by: string | null
          closing_balance: number
          closing_date: string
          cooperative_id: string
          created_at: string | null
          id: string
          notes: string | null
          opening_balance: number
          status: string | null
          total_deposits: number | null
          total_exchange_in: number | null
          total_exchange_out: number | null
          total_fees_collected: number | null
          total_loan_disbursements: number | null
          total_loan_repayments: number | null
          total_withdrawals: number | null
        }
        Insert: {
          branch_id?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number
          closing_date: string
          cooperative_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          opening_balance?: number
          status?: string | null
          total_deposits?: number | null
          total_exchange_in?: number | null
          total_exchange_out?: number | null
          total_fees_collected?: number | null
          total_loan_disbursements?: number | null
          total_loan_repayments?: number | null
          total_withdrawals?: number | null
        }
        Update: {
          branch_id?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closing_balance?: number
          closing_date?: string
          cooperative_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          opening_balance?: number
          status?: string | null
          total_deposits?: number | null
          total_exchange_in?: number | null
          total_exchange_out?: number | null
          total_fees_collected?: number | null
          total_loan_disbursements?: number | null
          total_loan_repayments?: number | null
          total_withdrawals?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_closings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      dividends: {
        Row: {
          agent_id: string | null
          cooperative_id: string
          created_at: string | null
          gross_amount: number
          id: string
          member_id: string
          net_amount: number
          paid_at: string | null
          period: string
          rate_applied: number
          share_count: number
          status: string | null
          tax_amount: number | null
        }
        Insert: {
          agent_id?: string | null
          cooperative_id: string
          created_at?: string | null
          gross_amount: number
          id?: string
          member_id: string
          net_amount: number
          paid_at?: string | null
          period: string
          rate_applied: number
          share_count: number
          status?: string | null
          tax_amount?: number | null
        }
        Update: {
          agent_id?: string | null
          cooperative_id?: string
          created_at?: string | null
          gross_amount?: number
          id?: string
          member_id?: string
          net_amount?: number
          paid_at?: string | null
          period?: string
          rate_applied?: number
          share_count?: number
          status?: string | null
          tax_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dividends_agent_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dividends_cooperative_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dividends_member_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dividends_member_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_with_age"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          cooperative_id: string
          created_at: string | null
          document_type: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["document_entity_type"]
          expires_at: string | null
          file_name: string | null
          file_size_kb: number | null
          file_url: string
          id: string
          uploaded_by: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          cooperative_id: string
          created_at?: string | null
          document_type: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["document_entity_type"]
          expires_at?: string | null
          file_name?: string | null
          file_size_kb?: number | null
          file_url: string
          id?: string
          uploaded_by?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          cooperative_id?: string
          created_at?: string | null
          document_type?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["document_entity_type"]
          expires_at?: string | null
          file_name?: string | null
          file_size_kb?: number | null
          file_url?: string
          id?: string
          uploaded_by?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          cooperative_id: string
          created_at: string | null
          from_currency: Database["public"]["Enums"]["currency_code"]
          id: string
          is_active: boolean | null
          rate: number
          set_by_agent_id: string
          to_currency: Database["public"]["Enums"]["currency_code"]
        }
        Insert: {
          cooperative_id: string
          created_at?: string | null
          from_currency: Database["public"]["Enums"]["currency_code"]
          id?: string
          is_active?: boolean | null
          rate: number
          set_by_agent_id: string
          to_currency?: Database["public"]["Enums"]["currency_code"]
        }
        Update: {
          cooperative_id?: string
          created_at?: string | null
          from_currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          is_active?: boolean | null
          rate?: number
          set_by_agent_id?: string
          to_currency?: Database["public"]["Enums"]["currency_code"]
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_agent_fkey"
            columns: ["set_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_transactions: {
        Row: {
          agent_id: string
          amount_given: number
          amount_received: number
          client_first_name: string
          client_id_number: string | null
          client_id_type: string | null
          client_last_name: string
          cooperative_id: string
          created_at: string | null
          exchange_rate_id: string
          from_currency: Database["public"]["Enums"]["currency_code"]
          id: string
          notes: string | null
          rate_applied: number
          ticket_number: string
          to_currency: Database["public"]["Enums"]["currency_code"]
        }
        Insert: {
          agent_id: string
          amount_given: number
          amount_received: number
          client_first_name: string
          client_id_number?: string | null
          client_id_type?: string | null
          client_last_name: string
          cooperative_id: string
          created_at?: string | null
          exchange_rate_id: string
          from_currency: Database["public"]["Enums"]["currency_code"]
          id?: string
          notes?: string | null
          rate_applied: number
          ticket_number: string
          to_currency?: Database["public"]["Enums"]["currency_code"]
        }
        Update: {
          agent_id?: string
          amount_given?: number
          amount_received?: number
          client_first_name?: string
          client_id_number?: string | null
          client_id_type?: string | null
          client_last_name?: string
          cooperative_id?: string
          created_at?: string | null
          exchange_rate_id?: string
          from_currency?: Database["public"]["Enums"]["currency_code"]
          id?: string
          notes?: string | null
          rate_applied?: number
          ticket_number?: string
          to_currency?: Database["public"]["Enums"]["currency_code"]
        }
        Relationships: [
          {
            foreignKeyName: "exchange_transactions_agent_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_transactions_exchange_rate_id_fkey"
            columns: ["exchange_rate_id"]
            isOneToOne: false
            referencedRelation: "exchange_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      fees: {
        Row: {
          amount: number
          cooperative_id: string
          created_at: string | null
          currency: string | null
          fee_type: string
          id: string
          is_active: boolean | null
          max_fee: number | null
          min_fee: number | null
          name: string
          transaction_type: string
        }
        Insert: {
          amount?: number
          cooperative_id: string
          created_at?: string | null
          currency?: string | null
          fee_type: string
          id?: string
          is_active?: boolean | null
          max_fee?: number | null
          min_fee?: number | null
          name: string
          transaction_type: string
        }
        Update: {
          amount?: number
          cooperative_id?: string
          created_at?: string | null
          currency?: string | null
          fee_type?: string
          id?: string
          is_active?: boolean | null
          max_fee?: number | null
          min_fee?: number | null
          name?: string
          transaction_type?: string
        }
        Relationships: []
      }
      fraud_flags: {
        Row: {
          cooperative_id: string
          created_at: string | null
          id: string
          rule_triggered: string
          severity: Database["public"]["Enums"]["fraud_severity"] | null
          transaction_id: string
        }
        Insert: {
          cooperative_id: string
          created_at?: string | null
          id?: string
          rule_triggered: string
          severity?: Database["public"]["Enums"]["fraud_severity"] | null
          transaction_id: string
        }
        Update: {
          cooperative_id?: string
          created_at?: string | null
          id?: string
          rule_triggered?: string
          severity?: Database["public"]["Enums"]["fraud_severity"] | null
          transaction_id?: string
        }
        Relationships: []
      }
      guarantors: {
        Row: {
          address: string | null
          cooperative_id: string
          created_at: string | null
          first_name: string
          id: string
          id_number: string | null
          id_type: string | null
          last_name: string
          loan_id: string
          member_id: string | null
          phone: string | null
          relationship: string | null
          status: string | null
        }
        Insert: {
          address?: string | null
          cooperative_id: string
          created_at?: string | null
          first_name: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_name: string
          loan_id: string
          member_id?: string | null
          phone?: string | null
          relationship?: string | null
          status?: string | null
        }
        Update: {
          address?: string | null
          cooperative_id?: string
          created_at?: string | null
          first_name?: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_name?: string
          loan_id?: string
          member_id?: string | null
          phone?: string | null
          relationship?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guarantors_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_messages: {
        Row: {
          cooperative_id: string
          created_at: string | null
          id: string
          message: string
          receiver_agent_id: string
          sender_agent_id: string
          status: string | null
        }
        Insert: {
          cooperative_id: string
          created_at?: string | null
          id?: string
          message: string
          receiver_agent_id: string
          sender_agent_id: string
          status?: string | null
        }
        Update: {
          cooperative_id?: string
          created_at?: string | null
          id?: string
          message?: string
          receiver_agent_id?: string
          sender_agent_id?: string
          status?: string | null
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          account_id: string
          amount: number
          balance_after: number
          cooperative_id: string
          created_at: string | null
          entry_type: Database["public"]["Enums"]["entry_type"]
          id: string
          transaction_id: string
        }
        Insert: {
          account_id: string
          amount: number
          balance_after: number
          cooperative_id: string
          created_at?: string | null
          entry_type: Database["public"]["Enums"]["entry_type"]
          id?: string
          transaction_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          balance_after?: number
          cooperative_id?: string
          created_at?: string | null
          entry_type?: Database["public"]["Enums"]["entry_type"]
          id?: string
          transaction_id?: string
        }
        Relationships: []
      }
      loan_products: {
        Row: {
          cooperative_id: string
          created_at: string | null
          description: string | null
          id: string
          interest_rate: number
          is_active: boolean | null
          max_amount: number
          max_duration_months: number
          min_amount: number
          min_duration_months: number
          name: string
          requires_collateral: boolean | null
          requires_guarantor: boolean | null
        }
        Insert: {
          cooperative_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          interest_rate: number
          is_active?: boolean | null
          max_amount: number
          max_duration_months: number
          min_amount: number
          min_duration_months: number
          name: string
          requires_collateral?: boolean | null
          requires_guarantor?: boolean | null
        }
        Update: {
          cooperative_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          interest_rate?: number
          is_active?: boolean | null
          max_amount?: number
          max_duration_months?: number
          min_amount?: number
          min_duration_months?: number
          name?: string
          requires_collateral?: boolean | null
          requires_guarantor?: boolean | null
        }
        Relationships: []
      }
      loan_repayments: {
        Row: {
          agent_id: string
          amount_due: number
          amount_paid: number | null
          cooperative_id: string
          created_at: string | null
          due_date: string
          id: string
          installment_no: number
          loan_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["repayment_status"] | null
        }
        Insert: {
          agent_id: string
          amount_due: number
          amount_paid?: number | null
          cooperative_id: string
          created_at?: string | null
          due_date: string
          id?: string
          installment_no: number
          loan_id: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["repayment_status"] | null
        }
        Update: {
          agent_id?: string
          amount_due?: number
          amount_paid?: number | null
          cooperative_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          installment_no?: number
          loan_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["repayment_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_repayments_agent_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_repayments_cooperative_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_repayments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          account_id: string
          agent_id: string
          amount_paid: number | null
          cooperative_id: string
          created_at: string | null
          disbursed_at: string | null
          due_date: string
          duration_months: number
          id: string
          interest_rate: number
          loan_number: string
          loan_product_id: string | null
          member_id: string
          monthly_payment: number
          principal_amount: number
          purpose: string | null
          status: Database["public"]["Enums"]["loan_status"] | null
          total_amount_due: number
        }
        Insert: {
          account_id: string
          agent_id: string
          amount_paid?: number | null
          cooperative_id: string
          created_at?: string | null
          disbursed_at?: string | null
          due_date: string
          duration_months: number
          id?: string
          interest_rate: number
          loan_number: string
          loan_product_id?: string | null
          member_id: string
          monthly_payment: number
          principal_amount: number
          purpose?: string | null
          status?: Database["public"]["Enums"]["loan_status"] | null
          total_amount_due: number
        }
        Update: {
          account_id?: string
          agent_id?: string
          amount_paid?: number | null
          cooperative_id?: string
          created_at?: string | null
          disbursed_at?: string | null
          due_date?: string
          duration_months?: number
          id?: string
          interest_rate?: number
          loan_number?: string
          loan_product_id?: string | null
          member_id?: string
          monthly_payment?: number
          principal_amount?: number
          purpose?: string | null
          status?: Database["public"]["Enums"]["loan_status"] | null
          total_amount_due?: number
        }
        Relationships: [
          {
            foreignKeyName: "loans_account_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_agent_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_cooperative_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_loan_product_id_fkey"
            columns: ["loan_product_id"]
            isOneToOne: false
            referencedRelation: "loan_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_member_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_member_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_with_age"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          birth_date: string
          cooperative_id: string
          created_at: string | null
          email: string | null
          emergency_contact_address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          id: string
          id_number: string | null
          id_type: string | null
          last_name: string
          member_number: string
          monthly_income: number | null
          nif: string | null
          phone: string | null
          photo_url: string | null
          profession: string | null
          status: Database["public"]["Enums"]["status_type"] | null
        }
        Insert: {
          address?: string | null
          birth_date: string
          cooperative_id: string
          created_at?: string | null
          email?: string | null
          emergency_contact_address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_name: string
          member_number: string
          monthly_income?: number | null
          nif?: string | null
          phone?: string | null
          photo_url?: string | null
          profession?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Update: {
          address?: string | null
          birth_date?: string
          cooperative_id?: string
          created_at?: string | null
          email?: string | null
          emergency_contact_address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          last_name?: string
          member_number?: string
          monthly_income?: number | null
          nif?: string | null
          phone?: string | null
          photo_url?: string | null
          profession?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "members_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          cooperative_id: string
          id: string
          member_id: string
          message: string
          read_at: string | null
          sent_at: string | null
          type: string
        }
        Insert: {
          cooperative_id: string
          id?: string
          member_id: string
          message: string
          read_at?: string | null
          sent_at?: string | null
          type: string
        }
        Update: {
          cooperative_id?: string
          id?: string
          member_id?: string
          message?: string
          read_at?: string | null
          sent_at?: string | null
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cooperative_id: string | null
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          cooperative_id?: string | null
          created_at?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          cooperative_id?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
      savings_products: {
        Row: {
          cooperative_id: string
          created_at: string | null
          description: string | null
          id: string
          interest_period: string | null
          interest_rate: number
          is_active: boolean | null
          min_balance: number | null
          min_deposit: number | null
          name: string
        }
        Insert: {
          cooperative_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          interest_period?: string | null
          interest_rate?: number
          is_active?: boolean | null
          min_balance?: number | null
          min_deposit?: number | null
          name: string
        }
        Update: {
          cooperative_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          interest_period?: string | null
          interest_rate?: number
          is_active?: boolean | null
          min_balance?: number | null
          min_deposit?: number | null
          name?: string
        }
        Relationships: []
      }
      settings_logs: {
        Row: {
          agent_id: string | null
          category: string
          changed_at: string | null
          cooperative_id: string
          id: string
          key: string
          new_value: Json
          old_value: Json | null
        }
        Insert: {
          agent_id?: string | null
          category: string
          changed_at?: string | null
          cooperative_id: string
          id?: string
          key: string
          new_value: Json
          old_value?: Json | null
        }
        Update: {
          agent_id?: string | null
          category?: string
          changed_at?: string | null
          cooperative_id?: string
          id?: string
          key?: string
          new_value?: Json
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settings_logs_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
      shares: {
        Row: {
          cooperative_id: string
          created_at: string | null
          id: string
          member_id: string
          purchased_at: string | null
          quantity: number
          share_number: string
          status: string | null
          total_value: number | null
          unit_value: number
        }
        Insert: {
          cooperative_id: string
          created_at?: string | null
          id?: string
          member_id: string
          purchased_at?: string | null
          quantity?: number
          share_number: string
          status?: string | null
          total_value?: number | null
          unit_value: number
        }
        Update: {
          cooperative_id?: string
          created_at?: string | null
          id?: string
          member_id?: string
          purchased_at?: string | null
          quantity?: number
          share_number?: string
          status?: string | null
          total_value?: number | null
          unit_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "shares_cooperative_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shares_member_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shares_member_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members_with_age"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          cooperative_id: string
          daily_withdraw_percent: number | null
          email_notifications_enabled: boolean | null
          fraud_threshold_amount: number | null
          late_penalty_rate: number | null
          loan_approval_required: boolean | null
          max_loan_to_share_ratio: number | null
          max_withdraw_percent: number | null
          min_shares_for_loan: number | null
          reserve_percent: number | null
          sms_notifications_enabled: boolean | null
        }
        Insert: {
          cooperative_id: string
          daily_withdraw_percent?: number | null
          email_notifications_enabled?: boolean | null
          fraud_threshold_amount?: number | null
          late_penalty_rate?: number | null
          loan_approval_required?: boolean | null
          max_loan_to_share_ratio?: number | null
          max_withdraw_percent?: number | null
          min_shares_for_loan?: number | null
          reserve_percent?: number | null
          sms_notifications_enabled?: boolean | null
        }
        Update: {
          cooperative_id?: string
          daily_withdraw_percent?: number | null
          email_notifications_enabled?: boolean | null
          fraud_threshold_amount?: number | null
          late_penalty_rate?: number | null
          loan_approval_required?: boolean | null
          max_loan_to_share_ratio?: number | null
          max_withdraw_percent?: number | null
          min_shares_for_loan?: number | null
          reserve_percent?: number | null
          sms_notifications_enabled?: boolean | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          agent_id: string
          amount: number
          cooperative_id: string
          created_at: string | null
          id: string
          motif: string | null
          reference: string | null
          status: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          account_id?: string | null
          agent_id: string
          amount: number
          cooperative_id: string
          created_at?: string | null
          id?: string
          motif?: string | null
          reference?: string | null
          status?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          account_id?: string | null
          agent_id?: string
          amount?: number
          cooperative_id?: string
          created_at?: string | null
          id?: string
          motif?: string | null
          reference?: string | null
          status?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cooperative_stats: {
        Row: {
          cooperative_id: string | null
          total_accounts: number | null
          total_deposits: number | null
          total_liquidity: number | null
          total_members: number | null
          total_transfers: number | null
          total_withdrawals: number | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_summary: {
        Row: {
          avg_rate: number | null
          cooperative_id: string | null
          day: string | null
          from_currency: Database["public"]["Enums"]["currency_code"] | null
          total_foreign_received: number | null
          total_htg_paid: number | null
          total_transactions: number | null
        }
        Relationships: []
      }
      loan_portfolio_stats: {
        Row: {
          active_loans: number | null
          completed_loans: number | null
          cooperative_id: string | null
          defaulted_loans: number | null
          outstanding_balance: number | null
          total_disbursed: number | null
          total_loans: number | null
          total_repaid: number | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_cooperative_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
      members_with_age: {
        Row: {
          address: string | null
          age: number | null
          birth_date: string | null
          cooperative_id: string | null
          created_at: string | null
          emergency_contact_address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          id: string | null
          id_number: string | null
          id_type: string | null
          last_name: string | null
          member_number: string | null
          phone: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["status_type"] | null
        }
        Insert: {
          address?: string | null
          age?: never
          birth_date?: string | null
          cooperative_id?: string | null
          created_at?: string | null
          emergency_contact_address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          id?: string | null
          id_number?: string | null
          id_type?: string | null
          last_name?: string | null
          member_number?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Update: {
          address?: string | null
          age?: never
          birth_date?: string | null
          cooperative_id?: string | null
          created_at?: string | null
          emergency_contact_address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          id?: string | null
          id_number?: string | null
          id_type?: string | null
          last_name?: string | null
          member_number?: string | null
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "members_cooperative_id_fkey"
            columns: ["cooperative_id"]
            isOneToOne: false
            referencedRelation: "cooperatives"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      decrement_vault: {
        Args: { coop_id: string; delta: number }
        Returns: undefined
      }
      deposit_money: {
        Args: {
          p_account_id: string
          p_agent_id: string
          p_amount: number
          p_motif: string
          p_reference: string
        }
        Returns: string
      }
      disburse_loan: {
        Args: { p_agent_id: string; p_loan_id: string }
        Returns: string
      }
      get_cooperative_summary: {
        Args: { coop_id: string }
        Returns: {
          flagged_count: number
          total_balance: number
          total_members: number
          vault_balance: number
        }[]
      }
      get_my_cooperative: { Args: never; Returns: string }
      get_settings_by_category: {
        Args: { p_category?: string; p_cooperative_id: string }
        Returns: Json
      }
      get_vault_balance: { Args: { coop_id: string }; Returns: number }
      increment_vault: {
        Args: { coop_id: string; delta: number }
        Returns: undefined
      }
      onboard_member: {
        Args: {
          p_birth_date: string
          p_cooperative_id: string
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_user_id?: string
        }
        Returns: {
          account_id: string
          account_number: string
          member_id: string
          member_number: string
        }[]
      }
      process_exchange: {
        Args: {
          p_agent_id: string
          p_amount_given: number
          p_client_first_name: string
          p_client_id_number: string
          p_client_id_type: string
          p_client_last_name: string
          p_cooperative_id: string
          p_from_currency: Database["public"]["Enums"]["currency_code"]
          p_notes?: string
        }
        Returns: {
          amount_received: number
          rate_applied: number
          ticket_number: string
          transaction_id: string
        }[]
      }
      repay_loan: {
        Args: { p_agent_id: string; p_amount: number; p_loan_id: string }
        Returns: string
      }
      set_exchange_rate: {
        Args: {
          p_agent_id: string
          p_cooperative_id: string
          p_from_currency: Database["public"]["Enums"]["currency_code"]
          p_rate: number
          p_to_currency: Database["public"]["Enums"]["currency_code"]
        }
        Returns: string
      }
      set_transaction_status: {
        Args: {
          new_status: Database["public"]["Enums"]["transaction_status"]
          tx_id: string
        }
        Returns: undefined
      }
      transfer_money: {
        Args: {
          p_agent_id: string
          p_amount: number
          p_from_account_id: string
          p_reference: string
          p_to_account_id: string
        }
        Returns: string
      }
      update_setting: {
        Args: {
          p_agent_id: string
          p_category: string
          p_cooperative_id: string
          p_key: string
          p_value: Json
        }
        Returns: Json
      }
      withdraw_money: {
        Args: {
          p_account_id: string
          p_agent_id: string
          p_amount: number
          p_motif: string
          p_reference: string
        }
        Returns: string
      }
    }
    Enums: {
      account_type:
        | "savings"
        | "deposit"
        | "wallet"
        | "current"
        | "checking"
        | "business"
        | "youth"
        | "salary"
        | "term_deposit"
        | "shares"
        | "loan_account"
      agent_role: "admin" | "manager" | "cashier"
      currency_code: "HTG" | "USD" | "CAD" | "DOP"
      document_entity_type: "member" | "loan" | "guarantor" | "cooperative"
      entry_type: "debit" | "credit"
      fraud_level: "low" | "medium" | "high"
      fraud_severity: "low" | "medium" | "high" | "critical"
      loan_status: "pending" | "active" | "completed" | "defaulted" | "rejected"
      repayment_status: "pending" | "paid" | "late" | "missed"
      status_type: "active" | "suspended" | "closed" | "pending"
      transaction_status:
        | "pending"
        | "approved"
        | "rejected"
        | "completed"
        | "flagged"
      transaction_type: "deposit" | "withdrawal" | "transfer" | "adjustment"
      user_role:
        | "platform_owner"
        | "super_admin"
        | "admin"
        | "cashier"
        | "auditor"
        | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_type: [
        "savings",
        "deposit",
        "wallet",
        "current",
        "checking",
        "business",
        "youth",
        "salary",
        "term_deposit",
        "shares",
        "loan_account",
      ],
      agent_role: ["admin", "manager", "cashier"],
      currency_code: ["HTG", "USD", "CAD", "DOP"],
      document_entity_type: ["member", "loan", "guarantor", "cooperative"],
      entry_type: ["debit", "credit"],
      fraud_level: ["low", "medium", "high"],
      fraud_severity: ["low", "medium", "high", "critical"],
      loan_status: ["pending", "active", "completed", "defaulted", "rejected"],
      repayment_status: ["pending", "paid", "late", "missed"],
      status_type: ["active", "suspended", "closed", "pending"],
      transaction_status: [
        "pending",
        "approved",
        "rejected",
        "completed",
        "flagged",
      ],
      transaction_type: ["deposit", "withdrawal", "transfer", "adjustment"],
      user_role: [
        "platform_owner",
        "super_admin",
        "admin",
        "cashier",
        "auditor",
        "member",
      ],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
