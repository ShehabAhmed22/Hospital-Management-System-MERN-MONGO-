// utils/Pagination.ts
interface PaginationProps {
  page?: number;
  limit?: number;
  total?: number;
}

export default class Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  skip: number;

  constructor({ page = 1, limit = 10, total = 0 }: PaginationProps = {}) {
    this.page = Math.max(1, parseInt(page.toString()));
    this.limit = Math.min(100, Math.max(1, parseInt(limit.toString())));
    this.total = parseInt(total.toString());
    this.totalPages = Math.ceil(this.total / this.limit);
    this.skip = (this.page - 1) * this.limit;
  }

  get prismaArgs() {
    return { skip: this.skip, take: this.limit };
  }

  getMeta() {
    return {
      total: this.total,
      page: this.page,
      limit: this.limit,
      totalPages: this.totalPages,
      hasNextPage: this.page < this.totalPages,
      hasPrevPage: this.page > 1,
    };
  }
}
