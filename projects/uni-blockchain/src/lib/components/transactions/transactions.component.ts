import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { startWith } from 'rxjs/operators';
import { takeUntil } from 'rxjs';

import { RxUnsubscribe, UniObject } from 'uni-common';

import { Transaction } from '../../models/interfaces/transaction.model';

import { UniTransactionsService } from './transactions.service';


@Component({
  selector: 'uni-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss'],
})
export class UniTransactionsComponent extends RxUnsubscribe implements OnInit, AfterViewInit {

  columns: string[] = ['sender', 'target', 'amount', 'status'];
  limits: number[] = [5, 10];
  limit: number = 5;
  transactionsCount: number;
  activeRequests: number = 1;
  data: Transaction[] = [];

  private transactions: Transaction[] = [];
  private transactionsCounts: UniObject<number>;
  private params: Partial<{ selected: number; }> = {};

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private transactionsService: UniTransactionsService) {
    super();
  }

  ngOnInit(): void {
    this.transactionsService.getTransactions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Transaction[]): void => {
        this.data = data;
        // Set reserved copy
        this.transactions = data;
        this.activeRequests--;
      });

    this.transactionsService.getTransactionsCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: UniObject<number>): void => {
        this.transactionsCounts = data;
        this.transactionsCount = this.params.selected ? data[this.params.selected] : 0;
        this.data = this.transactionsCount ? this.transactions : [];
      });
  }

  ngAfterViewInit(): void {
    this.transactionsService.getSelectedBlock()
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedBlock: number): void => {
        this.params.selected = selectedBlock;
        this.transactionsCount = this.transactionsCounts ? this.transactionsCounts[selectedBlock] : 0;

        // If the user selects other block, reset back to the first page.
        this.paginator.pageIndex = 0;

        if (this.transactionsCount) {
          this.loadTransactions();
        }
      });

    this.paginator.page
      .pipe(
        startWith({}),
        takeUntil(this.destroy$),
      )
      .subscribe((): void => (this.loadTransactions()));
  }

  private loadTransactions(): void {
    this.activeRequests++;

    this.transactionsService.loadTransactions({
      level: this.params.selected,
      page: this.paginator.pageIndex,
      limit: this.paginator.pageSize,
      fields: this.columns.toString(),
    });
  }
}