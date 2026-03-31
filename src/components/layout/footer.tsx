import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Shop</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><Link href="/products?category=GROCERIES" className="hover:text-emerald-800">Groceries</Link></li>
              <li><Link href="/products?category=SPICES" className="hover:text-emerald-800">Spices</Link></li>
              <li><Link href="/products?category=DRINKS" className="hover:text-emerald-800">Drinks</Link></li>
              <li><Link href="/products?category=BEAUTY" className="hover:text-emerald-800">Beauty</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Account</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><Link href="/account" className="hover:text-emerald-800">My Account</Link></li>
              <li><Link href="/account/orders" className="hover:text-emerald-800">Order History</Link></li>
              <li><Link href="/account/subscriptions" className="hover:text-emerald-800">Subscriptions</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Help</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><Link href="/recipes" className="hover:text-emerald-800">Recipes</Link></li>
              <li><a href="#" className="hover:text-emerald-800">Shipping Info</a></li>
              <li><a href="#" className="hover:text-emerald-800">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">NaijaPantry</h3>
            <p className="mt-3 text-sm text-gray-600">
              Authentic Nigerian foods delivered to your doorstep. From Garri to
              Egusi, we bring the taste of home to you.
            </p>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-xs text-gray-500">
          &copy; 2026 NaijaPantry. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
