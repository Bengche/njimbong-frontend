"use client";
import { currencies } from "../constants/currencies";
import { countries } from "../constants/countries";

interface Category {
  id: number;
  name: string;
}

interface SearchFiltersProps {
  filters: {
    category: string;
    search: string;
    country: string;
    city: string;
    minPrice: string;
    maxPrice: string;
    currency: string;
    condition: string;
  };
  categories: Category[];
  onFilterChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onSearch: () => void;
  onReset: () => void;
  onSaveSearch?: () => void;
}

export default function SearchFilters({
  filters,
  categories,
  onFilterChange,
  onSearch,
  onReset,
  onSaveSearch,
}: SearchFiltersProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-8 animate-slide-down">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <svg
          className="w-6 h-6 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        Advanced Search & Filters
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={onFilterChange}
            placeholder="Search by title or description..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category
          </label>
          <select
            name="category"
            value={filters.category}
            onChange={onFilterChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Country
          </label>
          <input
            type="text"
            name="country"
            value={filters.country}
            onChange={onFilterChange}
            list="country-filter-list"
            placeholder="Select country..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          />
          <datalist id="country-filter-list">
            {countries.map((country) => (
              <option key={country} value={country} />
            ))}
          </datalist>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            City
          </label>
          <input
            type="text"
            name="city"
            value={filters.city}
            onChange={onFilterChange}
            placeholder="Enter city..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          />
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Min Price
          </label>
          <input
            type="number"
            name="minPrice"
            value={filters.minPrice}
            onChange={onFilterChange}
            placeholder="0"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Max Price
          </label>
          <input
            type="number"
            name="maxPrice"
            value={filters.maxPrice}
            onChange={onFilterChange}
            placeholder="Any"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          />
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Currency
          </label>
          <input
            type="text"
            name="currency"
            value={filters.currency}
            onChange={onFilterChange}
            list="currency-filter-list"
            placeholder="All currencies..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          />
          <datalist id="currency-filter-list">
            {currencies.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.name} ({curr.symbol})
              </option>
            ))}
          </datalist>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Condition
          </label>
          <select
            name="condition"
            value={filters.condition}
            onChange={onFilterChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
          >
            <option value="">Any Condition</option>
            <option value="new">New</option>
            <option value="used">Used</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onSearch}
          className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Apply Filters
        </button>
        <button
          onClick={onReset}
          className="w-full sm:w-auto px-6 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reset Filters
        </button>
        {onSaveSearch && (
          <button
            onClick={onSaveSearch}
            className="w-full sm:w-auto px-6 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 transition flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Save Search
          </button>
        )}
      </div>
    </div>
  );
}
