export class Transaction {
  public errors: string[] = [];

  constructor(
    public id: string,
    public amount: number,
    public description: string,
    public date: Date,
    public accountId: string,
    public categoryId?: string,
    public status: 'PENDING' | 'COMPLETED' | 'CANCELLED' = 'COMPLETED'
  ) {}

  /**
   * Validate transaction data
   */
  isValid(): boolean {
    this.errors = [];

    if (!this.description?.trim()) {
      this.errors.push('Description is required');
    }

    if (this.amount === 0) {
      this.errors.push('Amount cannot be zero');
    }

    if (!this.accountId?.trim()) {
      this.errors.push('Account ID is required');
    }

    return this.errors.length === 0;
  }

  /**
   * Check if transaction is an expense
   */
  isExpense(): boolean {
    return this.amount < 0;
  }

  /**
   * Check if transaction is income
   */
  isIncome(): boolean {
    return this.amount > 0;
  }

  /**
   * Get absolute amount value
   */
  getAbsoluteAmount(): number {
    return Math.abs(this.amount);
  }

  /**
   * Check if transaction is pending
   */
  isPending(): boolean {
    return this.status === 'PENDING';
  }

  /**
   * Check if transaction is completed
   */
  isCompleted(): boolean {
    return this.status === 'COMPLETED';
  }

  /**
   * Check if transaction is cancelled
   */
  isCancelled(): boolean {
    return this.status === 'CANCELLED';
  }
}
