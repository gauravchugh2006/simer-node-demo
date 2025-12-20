import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MenuItem {
  name: string;
  description: string;
  price: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html'
})
export class MenuComponent {
  items: MenuItem[] = [
    {
      name: 'Hazelnut Cappuccino',
      description: 'Classic cappuccino elevated with nutty hazelnut syrup and cocoa dusting.',
      price: '$4.50'
    },
    {
      name: 'Cold Brew Tonic',
      description: 'Slow steeped cold brew over artisanal tonic and citrus peel.',
      price: '$5.80'
    },
    {
      name: 'Rose Pistachio Frappe',
      description: 'Floral rose milk blended with ice, espresso, and crushed pistachio.',
      price: '$6.20'
    },
    {
      name: 'Spiced Masala Chai',
      description: 'Slow simmered spices with Assam tea and creamy milk.',
      price: '$3.80'
    }
  ];
}
