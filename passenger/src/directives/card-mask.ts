import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
	selector: '[card-mask]',
  host: {
    '(blur)': 'onBlur($event)'
  }
})

export class CardMaskDirective {

	@Input('card-mask') cardMask: string;
	shownCodeLength: number = 4;
	maskChar: string = '*'; 

  constructor(private el: ElementRef) {
  }

  ngOnChanges(changes) {
  	if (this.cardMask && !changes.cardMask.previousValue)
  		setTimeout(() => {
  			this.showMask();
  		})
  }

  onBlur($event) {
  	if (this.el.nativeElement.children[0].value)
    	this.showMask();
  }

  showMask() {
  	if (this.cardMask.length > this.shownCodeLength)
  		this.el.nativeElement.children[0].value = Array(this.cardMask.length - this.shownCodeLength + 1).join(this.maskChar) + this.cardMask.slice(this.cardMask.length - this.shownCodeLength);
  }
}