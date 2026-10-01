"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CategorySelector = ({ categories, onChange, value }) => {
  const [selectedCategory, setSelectedCategory] = useState(value || "");

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);

    if (onChange && categoryId !== selectedCategory) {
      onChange(categoryId);
    }
  };

  // NEW: lets a parent (e.g. after a receipt scan) externally set the
  // selected category. Purely additive — if no `value` prop is passed,
  // this effect never fires and existing behavior is unchanged.
  useEffect(() => {
    if (value && value !== selectedCategory) {
      setSelectedCategory(value);
    }
  }, [value]);

  if (!categories || categories.length === 0) {
    return <div> No categories available</div>;
  }

  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      const defaultCategory =
        categories.find((cat) => cat.isDefault) || categories[0];

      setTimeout(() => {
        setSelectedCategory(defaultCategory.id);
        if (onChange) {
          onChange(defaultCategory.id);
        }
      }, 0);
    }
  }, []);
  return (
    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            <div className="flex items-center gap-2">
              <span>{category.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CategorySelector;
