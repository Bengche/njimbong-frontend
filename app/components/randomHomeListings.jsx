"use client"; // This allows useEffect and useState
import { useEffect, useState } from "react";
import Axios from "axios";

export default function FeaturedListings() {
  const [listings, setListings] = useState([]);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    Axios.get(`${API_BASE}/home/listings`)
      .then(res => setListings(res.data.listings || []))
      .catch(err => console.error(err));
  }, [API_BASE]);

  if (listings.length === 0) return null;

  return (
    <div className="rounded-2xl bg-emerald-700 p-6 text-white shadow-xl">
      <h2 className="text-xl font-semibold">Featured Listings</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {listings.map((listing: any) => (
          <li key={listing.id} className="rounded-lg bg-emerald-600/60 px-4 py-3">
            <a href={`/listing/${listing.id}`} className="font-semibold hover:underline">
              {listing.title}
            </a>
            <p className="text-gray-200">{listing.price}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}