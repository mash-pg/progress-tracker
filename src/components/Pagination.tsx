'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5; // 表示するページ番号の最大数

    if (totalPages <= maxPagesToShow) {
      for (let i = 0; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
      const endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

      if (startPage > 0) {
        pageNumbers.push(0);
        if (startPage > 1) {
          pageNumbers.push('...');
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
          pageNumbers.push('...');
        }
        pageNumbers.push(totalPages - 1);
      }
    }
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-center mt-3 space-x-1 text-xs">
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        variant="outline"
        size="sm"
      >
        前へ
      </Button>
      {pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {typeof page === 'number' ? (
            <Button
              onClick={() => onPageChange(page)}
              variant={currentPage === page ? 'default' : 'outline'}
              size="sm"
            >
              {page + 1}
            </Button>
          ) : (
            <span className="px-2 py-1 text-gray-700 dark:text-gray-300">{page}</span>
          )}
        </React.Fragment>
      ))}
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        variant="outline"
        size="sm"
      >
        次へ
      </Button>
    </div>
  );
};

export default Pagination;