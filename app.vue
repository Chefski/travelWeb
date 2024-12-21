<script setup lang="ts">
import WorldMap from "./components/worldMap.vue";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/vue";

import { defineStore } from "pinia";

const useStore = defineStore("main", {
  state: () => ({
    // define your state here
  }),
  actions: {
    // define your actions here
  },
});

const store = useStore();

const colorMode = useColorMode();
</script>

<template>
  <div class="min-h-screen bg-gray-100 font-outfit">
    <main class="pt-8 px-5 max-w-[1800px] mx-auto h-[calc(100vh-2rem)]">
      <div class="bg-white rounded-2xl p-6 shadow-lg h-full">
        <div class="flex gap-6 h-full">
          <!-- Left side -->
          <div class="w-1/2">
            <div class="rounded-xl overflow-hidden">
              <img
                src="https://images.pexels.com/photos/14621/Warsaw-at-night-free-license-CC0.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                alt=""
                class="w-full h-[200px] object-cover"
              />
            </div>
            <div>
              <div class="flex flex-row items-center justify-between">
                <h2 class="my-3 text-2xl font-semibold">Trip Name</h2>
              </div>
              <Separator />
            </div>
            <ScrollArea class="h-[600px] w-full">
              <h2 class="text-xl font-medium">Places</h2>
              <Input placeholder="Search for places" class="w-full mt-3" />
            </ScrollArea>
          </div>

          <!-- Right side -->
          <div class="w-1/2 h-full">
            <WorldMap />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap");

body {
  margin: 0;
  min-height: 100vh;
  font-family: "Outfit", sans-serif;
}
</style>
