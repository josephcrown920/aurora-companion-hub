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
      account_deletion_sweeps: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ad_variations: {
        Row: {
          aspect: string | null
          batch_id: string
          created_at: string
          error: string | null
          id: string
          kind: string
          likeness_id: string | null
          meta: Json
          source_generation_id: string | null
          status: string
          text_value: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          aspect?: string | null
          batch_id: string
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          likeness_id?: string | null
          meta?: Json
          source_generation_id?: string | null
          status?: string
          text_value?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          aspect?: string | null
          batch_id?: string
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          likeness_id?: string | null
          meta?: Json
          source_generation_id?: string | null
          status?: string
          text_value?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      affiliate_events: {
        Row: {
          amount_usd: number | null
          code: string
          created_at: string
          id: string
          kind: string
          ref_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_usd?: number | null
          code: string
          created_at?: string
          id?: string
          kind: string
          ref_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_usd?: number | null
          code?: string
          created_at?: string
          id?: string
          kind?: string
          ref_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          code: string
          commission_pct: number
          created_at: string
          id: string
          payout_email: string | null
          total_earned_usd: number
          user_id: string
        }
        Insert: {
          code: string
          commission_pct?: number
          created_at?: string
          id?: string
          payout_email?: string | null
          total_earned_usd?: number
          user_id: string
        }
        Update: {
          code?: string
          commission_pct?: number
          created_at?: string
          id?: string
          payout_email?: string | null
          total_earned_usd?: number
          user_id?: string
        }
        Relationships: []
      }
      ai_router_logs: {
        Row: {
          category: string
          created_at: string
          estimated_cost: number
          failure_reason: string | null
          fallback_count: number
          id: string
          latency_ms: number
          provider_used: string
          success: boolean
        }
        Insert: {
          category: string
          created_at?: string
          estimated_cost?: number
          failure_reason?: string | null
          fallback_count?: number
          id?: string
          latency_ms?: number
          provider_used: string
          success: boolean
        }
        Update: {
          category?: string
          created_at?: string
          estimated_cost?: number
          failure_reason?: string | null
          fallback_count?: number
          id?: string
          latency_ms?: number
          provider_used?: string
          success?: boolean
        }
        Relationships: []
      }
      api_logs: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip: string | null
          method: string
          response_time_ms: number
          source: string
          status: number
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip?: string | null
          method: string
          response_time_ms: number
          source: string
          status: number
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip?: string | null
          method?: string
          response_time_ms?: number
          source?: string
          status?: number
          user_agent?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      aurora_templates: {
        Row: {
          aura_cost: number
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          payload: Json | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          aura_cost?: number
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          payload?: Json | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          aura_cost?: number
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          payload?: Json | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      board_items: {
        Row: {
          board_id: string
          created_at: string
          height: number | null
          id: string
          image_url: string | null
          metadata: Json
          node_id: string | null
          prompt: string | null
          source_url: string | null
          type: string
          user_id: string
          video_url: string | null
          width: number | null
          x: number
          y: number
          z_index: number
        }
        Insert: {
          board_id: string
          created_at?: string
          height?: number | null
          id?: string
          image_url?: string | null
          metadata?: Json
          node_id?: string | null
          prompt?: string | null
          source_url?: string | null
          type?: string
          user_id: string
          video_url?: string | null
          width?: number | null
          x?: number
          y?: number
          z_index?: number
        }
        Update: {
          board_id?: string
          created_at?: string
          height?: number | null
          id?: string
          image_url?: string | null
          metadata?: Json
          node_id?: string | null
          prompt?: string | null
          source_url?: string | null
          type?: string
          user_id?: string
          video_url?: string | null
          width?: number | null
          x?: number
          y?: number
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_items_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          thumbnail: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          thumbnail?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          thumbnail?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_threads: {
        Row: {
          board_id: string | null
          created_at: string
          id: string
          messages: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_id?: string | null
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_id?: string | null
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string | null
          status: string
          topic: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name?: string | null
          status?: string
          topic?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string | null
          status?: string
          topic?: string
          user_id?: string | null
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          actor_id: string | null
          created_at: string
          delta: number
          id: string
          reason: string
          ref_id: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          delta: number
          id?: string
          reason: string
          ref_id?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          ref_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          name: string
          path: string | null
          payload: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          name: string
          path?: string | null
          payload?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          name?: string
          path?: string | null
          payload?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      generation_health_state: {
        Row: {
          alert_sent_at: string | null
          consecutive_errors: number
          consecutive_ok: number
          kind: string
          last_check_at: string | null
          last_error_summary: string | null
          last_ok_at: string | null
          recovery_sent_at: string | null
          updated_at: string
        }
        Insert: {
          alert_sent_at?: string | null
          consecutive_errors?: number
          consecutive_ok?: number
          kind: string
          last_check_at?: string | null
          last_error_summary?: string | null
          last_ok_at?: string | null
          recovery_sent_at?: string | null
          updated_at?: string
        }
        Update: {
          alert_sent_at?: string | null
          consecutive_errors?: number
          consecutive_ok?: number
          kind?: string
          last_check_at?: string | null
          last_error_summary?: string | null
          last_ok_at?: string | null
          recovery_sent_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      generation_idempotency_keys: {
        Row: {
          created_at: string
          error: string | null
          generation_id: string | null
          idempotency_key: string
          response: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          generation_id?: string | null
          idempotency_key: string
          response?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          generation_id?: string | null
          idempotency_key?: string
          response?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_idempotency_keys_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_logs: {
        Row: {
          created_at: string | null
          failed_criteria: string | null
          id: string
          kind: string
          memory_summary: string | null
          model: string
          result_url: string | null
          review_notes: string | null
          review_state: string
          task_type: string
          updated_at: string | null
          user_request: string
        }
        Insert: {
          created_at?: string | null
          failed_criteria?: string | null
          id?: string
          kind?: string
          memory_summary?: string | null
          model?: string
          result_url?: string | null
          review_notes?: string | null
          review_state?: string
          task_type?: string
          updated_at?: string | null
          user_request?: string
        }
        Update: {
          created_at?: string | null
          failed_criteria?: string | null
          id?: string
          kind?: string
          memory_summary?: string | null
          model?: string
          result_url?: string | null
          review_notes?: string | null
          review_state?: string
          task_type?: string
          updated_at?: string | null
          user_request?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          agent_shot_id: string | null
          audio_url: string | null
          camera_movement: string | null
          created_at: string
          credits_cost: number
          error: string | null
          id: string
          input_images: Json
          input_videos: Json
          is_favorite: boolean
          is_hidden: boolean
          is_public: boolean
          is_watermarked: boolean
          kind: string
          mode: string
          model: string | null
          motion_seed: number | null
          motion_video_url: string | null
          preview_fingerprint: string | null
          prompt: string
          result_image_url: string | null
          result_text: string | null
          result_video_url: string | null
          share_token: string | null
          status: string
          tags: string[]
          user_id: string
        }
        Insert: {
          agent_shot_id?: string | null
          audio_url?: string | null
          camera_movement?: string | null
          created_at?: string
          credits_cost?: number
          error?: string | null
          id?: string
          input_images?: Json
          input_videos?: Json
          is_favorite?: boolean
          is_hidden?: boolean
          is_public?: boolean
          is_watermarked?: boolean
          kind?: string
          mode?: string
          model?: string | null
          motion_seed?: number | null
          motion_video_url?: string | null
          preview_fingerprint?: string | null
          prompt: string
          result_image_url?: string | null
          result_text?: string | null
          result_video_url?: string | null
          share_token?: string | null
          status?: string
          tags?: string[]
          user_id: string
        }
        Update: {
          agent_shot_id?: string | null
          audio_url?: string | null
          camera_movement?: string | null
          created_at?: string
          credits_cost?: number
          error?: string | null
          id?: string
          input_images?: Json
          input_videos?: Json
          is_favorite?: boolean
          is_hidden?: boolean
          is_public?: boolean
          is_watermarked?: boolean
          kind?: string
          mode?: string
          model?: string | null
          motion_seed?: number | null
          motion_video_url?: string | null
          preview_fingerprint?: string | null
          prompt?: string
          result_image_url?: string | null
          result_text?: string | null
          result_video_url?: string | null
          share_token?: string | null
          status?: string
          tags?: string[]
          user_id?: string
        }
        Relationships: []
      }
      gift_cards: {
        Row: {
          amount_usd: number
          code: string
          created_at: string
          created_by: string
          credits: number
          design: string
          id: string
          note: string | null
          redeemed_at: string | null
          redeemed_by: string | null
        }
        Insert: {
          amount_usd?: number
          code: string
          created_at?: string
          created_by: string
          credits: number
          design?: string
          id?: string
          note?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Update: {
          amount_usd?: number
          code?: string
          created_at?: string
          created_by?: string
          credits?: number
          design?: string
          id?: string
          note?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Relationships: []
      }
      gpu_workers: {
        Row: {
          auth_token: string | null
          capabilities: string[]
          created_at: string
          endpoint_url: string
          id: string
          in_flight: number
          lanes: string[]
          last_heartbeat: string | null
          last_probe_at: string | null
          last_probe_detail: string | null
          last_probe_error: string | null
          last_probe_ok: boolean | null
          max_concurrency: number
          models: string[]
          name: string
          paused_reason: string | null
          priority: number
          protocol: string
          region: string | null
          status: string
          worker_role: string | null
        }
        Insert: {
          auth_token?: string | null
          capabilities?: string[]
          created_at?: string
          endpoint_url: string
          id?: string
          in_flight?: number
          lanes?: string[]
          last_heartbeat?: string | null
          last_probe_at?: string | null
          last_probe_detail?: string | null
          last_probe_error?: string | null
          last_probe_ok?: boolean | null
          max_concurrency?: number
          models?: string[]
          name: string
          paused_reason?: string | null
          priority?: number
          protocol?: string
          region?: string | null
          status?: string
          worker_role?: string | null
        }
        Update: {
          auth_token?: string | null
          capabilities?: string[]
          created_at?: string
          endpoint_url?: string
          id?: string
          in_flight?: number
          lanes?: string[]
          last_heartbeat?: string | null
          last_probe_at?: string | null
          last_probe_detail?: string | null
          last_probe_error?: string | null
          last_probe_ok?: boolean | null
          max_concurrency?: number
          models?: string[]
          name?: string
          paused_reason?: string | null
          priority?: number
          protocol?: string
          region?: string | null
          status?: string
          worker_role?: string | null
        }
        Relationships: []
      }
      guided_workflows: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          source_credit: string
          steps: Json
          tagline: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          source_credit?: string
          steps?: Json
          tagline?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          source_credit?: string
          steps?: Json
          tagline?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          attempts: number
          created_at: string
          credits_reserved: number
          credits_settled_at: string | null
          error: string | null
          finished_at: string | null
          generation_id: string | null
          id: string
          kind: string
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          parent_job_id: string | null
          payload: Json
          priority: number
          progress_pct: number | null
          progress_stage: string | null
          progress_updated_at: string | null
          queue: string
          result: Json | null
          scheduled_at: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          credits_reserved?: number
          credits_settled_at?: string | null
          error?: string | null
          finished_at?: string | null
          generation_id?: string | null
          id?: string
          kind: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          parent_job_id?: string | null
          payload?: Json
          priority?: number
          progress_pct?: number | null
          progress_stage?: string | null
          progress_updated_at?: string | null
          queue?: string
          result?: Json | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          credits_reserved?: number
          credits_settled_at?: string | null
          error?: string | null
          finished_at?: string | null
          generation_id?: string | null
          id?: string
          kind?: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          parent_job_id?: string | null
          payload?: Json
          priority?: number
          progress_pct?: number | null
          progress_stage?: string | null
          progress_updated_at?: string | null
          queue?: string
          result?: Json | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          ref_code: string | null
          source: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ref_code?: string | null
          source?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ref_code?: string | null
          source?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      legal_acceptances: {
        Row: {
          accepted_at: string
          document: string
          id: string
          ip: string | null
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          document: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          document?: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      likeness_locks: {
        Row: {
          created_at: string
          extra_paths: string[]
          id: string
          locked_at: string
          name: string
          primary_path: string
          spec: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          extra_paths?: string[]
          id?: string
          locked_at?: string
          name: string
          primary_path: string
          spec?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          extra_paths?: string[]
          id?: string
          locked_at?: string
          name?: string
          primary_path?: string
          spec?: Json
          user_id?: string
        }
        Relationships: []
      }
      lipsync_jobs: {
        Row: {
          audio_url: string
          batch_id: string | null
          created_at: string
          engine: string
          error: string | null
          id: string
          result_url: string | null
          status: string
          updated_at: string
          user_id: string
          video_url: string
        }
        Insert: {
          audio_url: string
          batch_id?: string | null
          created_at?: string
          engine?: string
          error?: string | null
          id?: string
          result_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          video_url: string
        }
        Update: {
          audio_url?: string
          batch_id?: string | null
          created_at?: string
          engine?: string
          error?: string | null
          id?: string
          result_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
      model_watch: {
        Row: {
          availability: string | null
          category: string | null
          first_seen: string
          id: string
          last_checked: string
          meta: Json
          model_id: string
          provider: string
          status: string
          title: string | null
          watch_kind: string
        }
        Insert: {
          availability?: string | null
          category?: string | null
          first_seen?: string
          id?: string
          last_checked?: string
          meta?: Json
          model_id: string
          provider: string
          status?: string
          title?: string | null
          watch_kind?: string
        }
        Update: {
          availability?: string | null
          category?: string | null
          first_seen?: string
          id?: string
          last_checked?: string
          meta?: Json
          model_id?: string
          provider?: string
          status?: string
          title?: string | null
          watch_kind?: string
        }
        Relationships: []
      }
      motion_autoscale_state: {
        Row: {
          cooldown_until: string | null
          created_at: string
          decision_lease_until: string | null
          enabled: boolean
          failure_count: number
          failure_reason: string | null
          last_activity_at: string | null
          last_decision_action: string | null
          last_decision_at: string | null
          last_decision_provider: string | null
          last_decision_reason: string | null
          singleton: boolean
          updated_at: string
        }
        Insert: {
          cooldown_until?: string | null
          created_at?: string
          decision_lease_until?: string | null
          enabled?: boolean
          failure_count?: number
          failure_reason?: string | null
          last_activity_at?: string | null
          last_decision_action?: string | null
          last_decision_at?: string | null
          last_decision_provider?: string | null
          last_decision_reason?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          cooldown_until?: string | null
          created_at?: string
          decision_lease_until?: string | null
          enabled?: boolean
          failure_count?: number
          failure_reason?: string | null
          last_activity_at?: string | null
          last_decision_action?: string | null
          last_decision_at?: string | null
          last_decision_provider?: string | null
          last_decision_reason?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_kobo: number
          created_at: string
          credit_funding_amount_minor: number | null
          credits_granted: number
          currency: string
          discount_percent_off: number | null
          gift_card_id: string | null
          id: string
          pro_days: number
          profit_amount_minor: number | null
          promo_code_id: string | null
          provider: string
          purpose: string
          raw: Json | null
          reference: string
          split_profit_pct: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_kobo: number
          created_at?: string
          credit_funding_amount_minor?: number | null
          credits_granted?: number
          currency?: string
          discount_percent_off?: number | null
          gift_card_id?: string | null
          id?: string
          pro_days?: number
          profit_amount_minor?: number | null
          promo_code_id?: string | null
          provider?: string
          purpose?: string
          raw?: Json | null
          reference: string
          split_profit_pct?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_kobo?: number
          created_at?: string
          credit_funding_amount_minor?: number | null
          credits_granted?: number
          currency?: string
          discount_percent_off?: number | null
          gift_card_id?: string | null
          id?: string
          pro_days?: number
          profit_amount_minor?: number | null
          promo_code_id?: string | null
          provider?: string
          purpose?: string
          raw?: Json | null
          reference?: string
          split_profit_pct?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cookie_consent: string | null
          created_at: string
          credits: number
          credits_reserved: number
          daily_spend_limit: number | null
          display_name: string | null
          email: string | null
          id: string
          lifetime_credits_purchased: number
          onboarding_bonus_granted: boolean
          paystack_subscription_code: string | null
          persona: string | null
          plan: string
          referred_by_code: string | null
          subscription_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cookie_consent?: string | null
          created_at?: string
          credits?: number
          credits_reserved?: number
          daily_spend_limit?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          lifetime_credits_purchased?: number
          onboarding_bonus_granted?: boolean
          paystack_subscription_code?: string | null
          persona?: string | null
          plan?: string
          referred_by_code?: string | null
          subscription_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cookie_consent?: string | null
          created_at?: string
          credits?: number
          credits_reserved?: number
          daily_spend_limit?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          lifetime_credits_purchased?: number
          onboarding_bonus_granted?: boolean
          paystack_subscription_code?: string | null
          persona?: string | null
          plan?: string
          referred_by_code?: string | null
          subscription_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_code_redemptions: {
        Row: {
          created_at: string
          id: string
          payment_reference: string | null
          promo_code_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_reference?: string | null
          promo_code_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_reference?: string | null
          promo_code_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          active: boolean
          bonus_credits: number | null
          code: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          kind: string
          max_redemptions: number | null
          note: string | null
          percent_off: number | null
          redemption_count: number
        }
        Insert: {
          active?: boolean
          bonus_credits?: number | null
          code: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          kind: string
          max_redemptions?: number | null
          note?: string | null
          percent_off?: number | null
          redemption_count?: number
        }
        Update: {
          active?: boolean
          bonus_credits?: number | null
          code?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          kind?: string
          max_redemptions?: number | null
          note?: string | null
          percent_off?: number | null
          redemption_count?: number
        }
        Relationships: []
      }
      promotion_sweep_state: {
        Row: {
          day: string
          failed: number
          lease_expires: string | null
          lease_owner: string | null
          link_cursor: number
          links_done: boolean
          retried_today: boolean
          retry: Json
          retry_overflow: number
          skipped: number
          synced: number
          tiktok_cursor: string
          tiktok_done: boolean
          updated_at: string
        }
        Insert: {
          day: string
          failed?: number
          lease_expires?: string | null
          lease_owner?: string | null
          link_cursor?: number
          links_done?: boolean
          retried_today?: boolean
          retry?: Json
          retry_overflow?: number
          skipped?: number
          synced?: number
          tiktok_cursor?: string
          tiktok_done?: boolean
          updated_at?: string
        }
        Update: {
          day?: string
          failed?: number
          lease_expires?: string | null
          lease_owner?: string | null
          link_cursor?: number
          links_done?: boolean
          retried_today?: boolean
          retry?: Json
          retry_overflow?: number
          skipped?: number
          synced?: number
          tiktok_cursor?: string
          tiktok_done?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      provider_logs: {
        Row: {
          cost_usd: number | null
          created_at: string
          endpoint: string
          error: string | null
          id: string
          kind: string
          latency_ms: number | null
          provider: string
          ref_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          endpoint: string
          error?: string | null
          id?: string
          kind: string
          latency_ms?: number | null
          provider: string
          ref_id?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          endpoint?: string
          error?: string | null
          id?: string
          kind?: string
          latency_ms?: number | null
          provider?: string
          ref_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rebase_events: {
        Row: {
          applied_at: string
          key: string
        }
        Insert: {
          applied_at?: string
          key: string
        }
        Update: {
          applied_at?: string
          key?: string
        }
        Relationships: []
      }
      render_jobs: {
        Row: {
          board_id: string
          created_at: string
          error: string | null
          id: string
          input_image_url: string | null
          kind: string
          model: string
          output_url: string | null
          params: Json
          prompt: string
          shot_id: string
          status: string
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          board_id: string
          created_at?: string
          error?: string | null
          id?: string
          input_image_url?: string | null
          kind?: string
          model: string
          output_url?: string | null
          params?: Json
          prompt: string
          shot_id: string
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          board_id?: string
          created_at?: string
          error?: string | null
          id?: string
          input_image_url?: string | null
          kind?: string
          model?: string
          output_url?: string | null
          params?: Json
          prompt?: string
          shot_id?: string
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: []
      }
      scheduler_heartbeats: {
        Row: {
          last_error: string | null
          last_ok_at: string | null
          last_run_at: string | null
          name: string
          updated_at: string
        }
        Insert: {
          last_error?: string | null
          last_ok_at?: string | null
          last_run_at?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          last_error?: string | null
          last_ok_at?: string | null
          last_run_at?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          kind: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          kind?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          key?: string
          kind?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      site_copy: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      site_images: {
        Row: {
          default_url: string
          key: string
          label: string
          section: string
          updated_at: string
          url: string
        }
        Insert: {
          default_url?: string
          key: string
          label?: string
          section?: string
          updated_at?: string
          url: string
        }
        Update: {
          default_url?: string
          key?: string
          label?: string
          section?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      site_map_items: {
        Row: {
          archived_at: string | null
          description: string
          flow_order: number
          id: string
          kind: string
          path: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          description?: string
          flow_order?: number
          id?: string
          kind: string
          path: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          description?: string
          flow_order?: number
          id?: string
          kind?: string
          path?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      spin_jobs: {
        Row: {
          audio_url: string | null
          avatar_id: string | null
          created_at: string
          face_url: string | null
          id: string
          mode: string
          product_url: string | null
          prompt: string
          script: string | null
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          avatar_id?: string | null
          created_at?: string
          face_url?: string | null
          id?: string
          mode?: string
          product_url?: string | null
          prompt: string
          script?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          avatar_id?: string | null
          created_at?: string
          face_url?: string | null
          id?: string
          mode?: string
          product_url?: string | null
          prompt?: string
          script?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spin_variants: {
        Row: {
          created_at: string
          error: string | null
          id: string
          idx: number
          job_id: string
          kind: string
          label: string
          prompt: string | null
          spec: Json | null
          status: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          idx: number
          job_id: string
          kind?: string
          label: string
          prompt?: string | null
          spec?: Json | null
          status?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          idx?: number
          job_id?: string
          kind?: string
          label?: string
          prompt?: string | null
          spec?: Json | null
          status?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spin_variants_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "spin_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      tiktok_accounts: {
        Row: {
          access_token: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          oauth_return_to: string | null
          oauth_state: string | null
          oauth_state_at: string | null
          open_id: string
          refresh_expires_at: string
          refresh_token: string
          scope: string | null
          token_expires_at: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          access_token: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          oauth_return_to?: string | null
          oauth_state?: string | null
          oauth_state_at?: string | null
          open_id: string
          refresh_expires_at: string
          refresh_token: string
          scope?: string | null
          token_expires_at: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          access_token?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          oauth_return_to?: string | null
          oauth_state?: string | null
          oauth_state_at?: string | null
          open_id?: string
          refresh_expires_at?: string
          refresh_token?: string
          scope?: string | null
          token_expires_at?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tiktok_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tiktok_posts: {
        Row: {
          created_at: string
          error_msg: string | null
          generation_id: string | null
          id: string
          posted_at: string | null
          publish_id: string | null
          retry_count: number
          status: string
          title: string | null
          updated_at: string
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          error_msg?: string | null
          generation_id?: string | null
          id?: string
          posted_at?: string | null
          publish_id?: string | null
          retry_count?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string
          error_msg?: string | null
          generation_id?: string | null
          id?: string
          posted_at?: string | null
          publish_id?: string | null
          retry_count?: number
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiktok_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tiktok_remixes: {
        Row: {
          child_generation_ids: Json
          child_job_ids: Json
          created_at: string
          error: string | null
          highlights: Json
          id: string
          prompt: string | null
          source_generation_id: string | null
          source_video_url: string
          status: string
          target_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          child_generation_ids?: Json
          child_job_ids?: Json
          created_at?: string
          error?: string | null
          highlights?: Json
          id?: string
          prompt?: string | null
          source_generation_id?: string | null
          source_video_url: string
          status?: string
          target_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          child_generation_ids?: Json
          child_job_ids?: Json
          created_at?: string
          error?: string | null
          highlights?: Json
          id?: string
          prompt?: string | null
          source_generation_id?: string | null
          source_video_url?: string
          status?: string
          target_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      uptime_monitor_state: {
        Row: {
          alert_sent_at: string | null
          consecutive_failures: number
          id: string
          last_check_at: string | null
          last_error: string | null
          last_ok_at: string | null
          recovery_sent_at: string | null
          updated_at: string
        }
        Insert: {
          alert_sent_at?: string | null
          consecutive_failures?: number
          id?: string
          last_check_at?: string | null
          last_error?: string | null
          last_ok_at?: string | null
          recovery_sent_at?: string | null
          updated_at?: string
        }
        Update: {
          alert_sent_at?: string | null
          consecutive_failures?: number
          id?: string
          last_check_at?: string | null
          last_error?: string | null
          last_ok_at?: string | null
          recovery_sent_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vast_managed_instances: {
        Row: {
          adopted: boolean
          created_at: string
          created_by: string
          destroy_deadline: string
          destroyed_at: string | null
          endpoint_url: string | null
          failure_reason: string | null
          gpu_name: string | null
          hourly_usd: number
          id: string
          label: string
          state: string
          updated_at: string
          vast_instance_id: number
          worker_id: string | null
        }
        Insert: {
          adopted?: boolean
          created_at?: string
          created_by: string
          destroy_deadline: string
          destroyed_at?: string | null
          endpoint_url?: string | null
          failure_reason?: string | null
          gpu_name?: string | null
          hourly_usd: number
          id?: string
          label?: string
          state?: string
          updated_at?: string
          vast_instance_id: number
          worker_id?: string | null
        }
        Update: {
          adopted?: boolean
          created_at?: string
          created_by?: string
          destroy_deadline?: string
          destroyed_at?: string | null
          endpoint_url?: string | null
          failure_reason?: string | null
          gpu_name?: string | null
          hourly_usd?: number
          id?: string
          label?: string
          state?: string
          updated_at?: string
          vast_instance_id?: number
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vast_managed_instances_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "gpu_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      video_agent_submissions: {
        Row: {
          cost: number
          created_at: string
          finalized_at: string | null
          generation_id: string | null
          orientation: string
          prompt: string
          reservation_ref: string
          user_id: string
          video_id: string
        }
        Insert: {
          cost: number
          created_at?: string
          finalized_at?: string | null
          generation_id?: string | null
          orientation?: string
          prompt: string
          reservation_ref: string
          user_id: string
          video_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          finalized_at?: string | null
          generation_id?: string | null
          orientation?: string
          prompt?: string
          reservation_ref?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      watchdog_actions: {
        Row: {
          action: string
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          result: string
          subsystem: string
        }
        Insert: {
          action: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          result: string
          subsystem: string
        }
        Update: {
          action?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          result?: string
          subsystem?: string
        }
        Relationships: []
      }
      watchdog_state: {
        Row: {
          alert_sent_at: string | null
          consecutive_failures: number
          detail: string | null
          last_action: string | null
          last_action_at: string | null
          last_check_at: string | null
          last_ok_at: string | null
          recovery_sent_at: string | null
          status: string
          subsystem: string
          transition_gen: number
          updated_at: string
        }
        Insert: {
          alert_sent_at?: string | null
          consecutive_failures?: number
          detail?: string | null
          last_action?: string | null
          last_action_at?: string | null
          last_check_at?: string | null
          last_ok_at?: string | null
          recovery_sent_at?: string | null
          status?: string
          subsystem: string
          transition_gen?: number
          updated_at?: string
        }
        Update: {
          alert_sent_at?: string | null
          consecutive_failures?: number
          detail?: string | null
          last_action?: string | null
          last_action_at?: string | null
          last_check_at?: string | null
          last_ok_at?: string | null
          recovery_sent_at?: string | null
          status?: string
          subsystem?: string
          transition_gen?: number
          updated_at?: string
        }
        Relationships: []
      }
      worker_jobs: {
        Row: {
          cost_usd: number | null
          created_at: string
          error: string | null
          id: string
          kind: string
          latency_ms: number | null
          ref_id: string | null
          status: string
          user_id: string | null
          worker_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          latency_ms?: number | null
          ref_id?: string | null
          status?: string
          user_id?: string | null
          worker_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          latency_ms?: number | null
          ref_id?: string | null
          status?: string
          user_id?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_jobs_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "gpu_workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_register_attempts: {
        Row: {
          created_at: string
          endpoint_url: string | null
          error: string | null
          id: string
          name: string | null
          ok: boolean
          outcome: string | null
          protocol: string | null
        }
        Insert: {
          created_at?: string
          endpoint_url?: string | null
          error?: string | null
          id?: string
          name?: string | null
          ok: boolean
          outcome?: string | null
          protocol?: string | null
        }
        Update: {
          created_at?: string
          endpoint_url?: string | null
          error?: string | null
          id?: string
          name?: string | null
          ok?: boolean
          outcome?: string | null
          protocol?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string
          description: string | null
          graph: Json
          id: string
          is_public: boolean
          last_output_kind: string | null
          last_output_url: string | null
          name: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          graph?: Json
          id?: string
          is_public?: boolean
          last_output_kind?: string | null
          last_output_url?: string | null
          name: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          graph?: Json
          id?: string
          is_public?: boolean
          last_output_kind?: string | null
          last_output_url?: string | null
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      gpu_pool_health: {
        Row: {
          configured_workers: number | null
          degraded_workers: number | null
          healthy_pct: number | null
          healthy_workers: number | null
          in_flight: number | null
          last_probe_at: string | null
          max_concurrency: number | null
          oldest_healthy_heartbeat: string | null
          unavailable_workers: number | null
          utilization_pct: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_pro_subscription: {
        Args: { _expires_at: string; _sub_code: string; _user: string }
        Returns: undefined
      }
      admin_reconcile_stuck_reservation: {
        Args: {
          _actor: string
          _expected_amount: number
          _job: string
          _user: string
        }
        Returns: string
      }
      claim_email_delivery: {
        Args: {
          _dedupe_key: string
          _template: string
          _to_email: string
          _user: string
        }
        Returns: string
      }
      claim_first_admin: { Args: never; Returns: boolean }
      claim_motion_autoscale_decision: {
        Args: { _action: string; _provider: string }
        Returns: boolean
      }
      claim_multishot_operation: {
        Args: {
          _expected_revision: number
          _expected_status: string
          _expected_token: string
          _kind: string
          _lease_seconds?: number
          _new_token: string
          _shot_id: string
          _user_id: string
        }
        Returns: boolean
      }
      claim_next_job: {
        Args: { _worker: string }
        Returns: {
          attempts: number
          created_at: string
          credits_reserved: number
          credits_settled_at: string | null
          error: string | null
          finished_at: string | null
          generation_id: string | null
          id: string
          kind: string
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          parent_job_id: string | null
          payload: Json
          priority: number
          progress_pct: number | null
          progress_stage: string | null
          progress_updated_at: string | null
          queue: string
          result: Json | null
          scheduled_at: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_next_job_v2: {
        Args: { _lanes: string[]; _worker: string }
        Returns: {
          attempts: number
          created_at: string
          credits_reserved: number
          credits_settled_at: string | null
          error: string | null
          finished_at: string | null
          generation_id: string | null
          id: string
          kind: string
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          parent_job_id: string | null
          payload: Json
          priority: number
          progress_pct: number | null
          progress_stage: string | null
          progress_updated_at: string | null
          queue: string
          result: Json | null
          scheduled_at: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_onboarding_bonus: {
        Args: { _amount: number; _user: string }
        Returns: boolean
      }
      claim_tiktok_retry: {
        Args: {
          p_cooldown_ms: number
          p_max_attempts: number
          p_post_id: string
          p_user_id: string
        }
        Returns: {
          created_at: string
          error_msg: string | null
          generation_id: string | null
          id: string
          posted_at: string | null
          publish_id: string | null
          retry_count: number
          status: string
          title: string | null
          updated_at: string
          user_id: string
          video_url: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tiktok_posts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      commit_reservation: {
        Args: { _amount: number; _reason: string; _ref: string; _user: string }
        Returns: undefined
      }
      create_generation_and_reserve: {
        Args: {
          _amount: number
          _kind: string
          _payload: Json
          _prompt: string
          _user: string
        }
        Returns: {
          generation_id: string
          job_id: string
        }[]
      }
      create_motion_generation_and_reserve: {
        Args: {
          _amount: number
          _payload: Json
          _prompt: string
          _user: string
        }
        Returns: {
          generation_id: string
          job_id: string
        }[]
      }
      deactivate_pro_subscription: {
        Args: { _user: string }
        Returns: undefined
      }
      deduct_credits: {
        Args: { _amount: number; _reason: string; _ref: string; _user: string }
        Returns: boolean
      }
      finalize_job: {
        Args: {
          _error: string
          _job: string
          _model: string
          _outcome: string
          _result: Json
          _result_image_url: string
          _result_video_url: string
          _worker: string
        }
        Returns: string
      }
      finalize_marketplace_run: {
        Args: {
          _amount: number
          _aura_charged: number
          _creator_cut_aura: number
          _creator_ref: string
          _creator_user_id: string
          _platform_cut_aura: number
          _reason: string
          _ref: string
          _runner_user_id: string
          _template_id: string
        }
        Returns: undefined
      }
      finalize_sync_render: {
        Args: {
          _agent_shot_id: string
          _amount: number
          _audio_url: string
          _credits_cost: number
          _input_images: Json
          _kind: string
          _mode: string
          _model: string
          _prompt: string
          _reason: string
          _ref: string
          _result_image_url: string
          _result_text: string
          _result_video_url: string
          _session_id: string
          _user_id: string
        }
        Returns: string
      }
      gpu_worker_inflight_dec: { Args: { _worker: string }; Returns: number }
      gpu_worker_inflight_inc: { Args: { _worker: string }; Returns: number }
      grant_credits: {
        Args: {
          _actor?: string
          _amount: number
          _reason: string
          _ref: string
          _user: string
        }
        Returns: undefined
      }
      grant_free_daily_aura_all: { Args: { _day?: string }; Returns: number }
      grant_free_monthly_aura_all: {
        Args: { _month?: string }
        Returns: number
      }
      grant_monthly_aura: {
        Args: { _amount: number; _ref: string; _user: string }
        Returns: boolean
      }
      grant_pro_access: {
        Args: { _days: number; _source_ref: string; _user: string }
        Returns: boolean
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user: string }
        Returns: boolean
      }
      reconcile_expired_pro_access: { Args: never; Returns: number }
      reconcile_stuck_reservation: { Args: { _job: string }; Returns: string }
      redeem_gift_card: {
        Args: { _code: string; _user: string }
        Returns: {
          credits: number
          design: string
          kind: string
          pro_days: number
        }[]
      }
      release_reservation: {
        Args: { _amount: number; _reason: string; _ref: string; _user: string }
        Returns: undefined
      }
      requeue_failed_job: {
        Args: { _backoff_seconds: number; _job: string }
        Returns: string
      }
      reserve_credits: {
        Args: { _amount: number; _reason: string; _ref: string; _user: string }
        Returns: boolean
      }
      reset_stale_processing_jobs: {
        Args: {
          _backoff_seconds: number
          _give_up_age_seconds?: number
          _give_up_attempts?: number
          _max_age_seconds: number
        }
        Returns: number
      }
      reset_stale_processing_jobs_for_kinds: {
        Args: {
          _backoff_seconds: number
          _give_up_age_seconds?: number
          _give_up_attempts?: number
          _kinds: string[]
          _max_age_seconds: number
        }
        Returns: number
      }
      watchdog_claim_transition: {
        Args: { p_kind: string; p_now: string; p_subsystem: string }
        Returns: Json
      }
      watchdog_record_state: {
        Args: {
          p_degraded: boolean
          p_detail: string
          p_now: string
          p_status: string
          p_subsystem: string
        }
        Returns: undefined
      }
      watchdog_restore_transition: {
        Args: {
          p_claim_gen: number
          p_kind: string
          p_prev_alert: string
          p_prev_recovery: string
          p_subsystem: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
