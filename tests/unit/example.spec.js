import { shallowMount } from "@vue/test-utils";
import Content from "@/components/Content.vue";

describe("Content.vue", () => {
  it("renders props.msg when passed", () => {
    const msg = "Welcome to Your Vue.js App";
    const wrapper = shallowMount(Content, {
      props: { msg },
    });
    expect(wrapper.text()).toMatch(msg);
  });
});
