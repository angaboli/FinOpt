-- Finopt Database Schema
-- Run this on Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE account_type AS ENUM (
    'CHECKING',
    'SAVINGS',
    'CREDIT_CARD',
    'BUSINESS',
    'CASH',
    'INVESTMENT',
    'LOAN',
    'OTHER'
);

CREATE TYPE owner_scope AS ENUM ('PERSONAL', 'PROFESSIONAL');

CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

CREATE TYPE notification_type AS ENUM (
    'BUDGET_WARNING',
    'BUDGET_EXCEEDED',
    'ANOMALY_DETECTED',
    'GOAL_MILESTONE',
    'INSIGHT_READY'
);

CREATE TYPE goal_status AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type account_type NOT NULL,
    owner_scope owner_scope NOT NULL DEFAULT 'PERSONAL',
    currency TEXT NOT NULL DEFAULT 'EUR',
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    bank_name TEXT,
    iban_last4 TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(type);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_system BOOLEAN DEFAULT false,
    parent_category_id UUID REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Insert default categories
INSERT INTO categories (name, icon, color, is_system) VALUES
('Salaire', '💰', '#10b981', true),
('Nourriture', '🍔', '#f59e0b', true),
('Transport', '🚗', '#3b82f6', true),
('Logement', '🏠', '#8b5cf6', true),
('Shopping', '🛍️', '#ec4899', true),
('Loisirs', '🎮', '#06b6d4', true),
('Santé', '⚕️', '#ef4444', true),
('Abonnements', '📱', '#6366f1', true),
('Épargne', '🏦', '#14b8a6', true),
('Autre', '📌', '#6b7280', true);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    date TIMESTAMPTZ NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    merchant_name TEXT,
    is_recurring BOOLEAN DEFAULT false,
    is_manual BOOLEAN DEFAULT false,
    status transaction_status DEFAULT 'COMPLETED',
    notes TEXT,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_deleted_at ON transactions(deleted_at) WHERE deleted_at IS NULL;

-- Budgets table
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    warning_threshold DECIMAL(3, 2) DEFAULT 0.80,
    critical_threshold DECIMAL(3, 2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
CREATE INDEX idx_budgets_period ON budgets(period_start, period_end);

-- Budget events table (for tracking threshold breaches)
CREATE TABLE budget_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    threshold_percentage DECIMAL(5, 2) NOT NULL,
    current_spent DECIMAL(15, 2) NOT NULL,
    budget_amount DECIMAL(15, 2) NOT NULL,
    triggered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_events_budget_id ON budget_events(budget_id);
CREATE INDEX idx_budget_events_user_id ON budget_events(user_id);

-- Insights table (AI-generated recommendations)
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,
    data JSONB NOT NULL,
    income_estimate DECIMAL(15, 2),
    fixed_costs_estimate DECIMAL(15, 2),
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_user_id ON insights(user_id);
CREATE INDEX idx_insights_month_year ON insights(month_year);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Notification preferences table
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    budget_warnings_enabled BOOLEAN DEFAULT true,
    budget_exceeded_enabled BOOLEAN DEFAULT true,
    anomaly_alerts_enabled BOOLEAN DEFAULT true,
    insights_enabled BOOLEAN DEFAULT true,
    warning_threshold DECIMAL(3, 2) DEFAULT 0.80,
    critical_threshold DECIMAL(3, 2) DEFAULT 1.00,
    push_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals table (future feature)
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    target_date DATE NOT NULL,
    priority INTEGER DEFAULT 1,
    linked_account_id UUID REFERENCES accounts(id),
    status goal_status DEFAULT 'ACTIVE',
    plan JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);

-- Import history table (track imported statements)
CREATE TABLE import_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    transactions_imported INTEGER DEFAULT 0,
    status TEXT NOT NULL,
    error_message TEXT,
    imported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_import_history_user_id ON import_history(user_id);
CREATE INDEX idx_import_history_account_id ON import_history(account_id);

-- Functions and Triggers

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate account balance from transactions
CREATE OR REPLACE FUNCTION calculate_account_balance(account_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total DECIMAL;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total
    FROM transactions
    WHERE account_id = account_uuid
      AND status = 'COMPLETED'
      AND deleted_at IS NULL;
    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to get budget consumption
CREATE OR REPLACE FUNCTION get_budget_consumption(budget_uuid UUID)
RETURNS TABLE (
    budget_id UUID,
    budget_amount DECIMAL,
    spent DECIMAL,
    percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.amount,
        COALESCE(SUM(ABS(t.amount)), 0) as spent,
        CASE
            WHEN b.amount > 0 THEN (COALESCE(SUM(ABS(t.amount)), 0) / b.amount) * 100
            ELSE 0
        END as percentage
    FROM budgets b
    LEFT JOIN transactions t ON
        t.category_id = b.category_id
        AND t.user_id = b.user_id
        AND t.date >= b.period_start
        AND t.date <= b.period_end
        AND t.amount < 0
        AND t.status = 'COMPLETED'
        AND t.deleted_at IS NULL
    WHERE b.id = budget_uuid
    GROUP BY b.id, b.amount;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own accounts" ON accounts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view categories" ON categories
    FOR SELECT USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own categories" ON categories
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own budgets" ON budgets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own budget_events" ON budget_events
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own insights" ON insights
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification_preferences" ON notification_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own goals" ON goals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own import_history" ON import_history
    FOR ALL USING (auth.uid() = user_id);

-- Create initial admin function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

COMMENT ON TABLE accounts IS 'User financial accounts with type differentiation';
COMMENT ON TABLE transactions IS 'Financial transactions with manual entry support';
COMMENT ON TABLE budgets IS 'Category-based budgets with threshold monitoring';
COMMENT ON TABLE budget_events IS 'Budget threshold breach events for notifications';
COMMENT ON TABLE insights IS 'AI-generated financial insights and recommendations';
COMMENT ON TABLE goals IS 'User financial goals with AI-powered planning';
