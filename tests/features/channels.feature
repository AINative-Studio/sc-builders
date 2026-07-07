Feature: Channel lifecycle
  As a community organizer
  I want to create and manage channels
  So that members can find topic-specific spaces

  Scenario: Organizer creates a new channel
    Given I am logged in as an organizer
    When I create a channel with slug "rust-dev" and name "Rust Developers"
    Then the response status is 201
    And the channel has slug "rust-dev"
    And a "community.channel.created" event is emitted

  Scenario: Creating a duplicate channel is rejected
    Given I am logged in as an organizer
    And a channel with slug "general" already exists
    When I create a channel with slug "general" and name "General"
    Then the response status is 409

  Scenario: Members can list public channels
    Given there are public channels in the registry
    When I list channels
    Then the response status is 200
    And the response contains "items" with at least 1 entry
    And archived channels are excluded

  Scenario: Members can view a single channel by slug
    Given a channel with slug "general" exists
    When I get channel "general"
    Then the response status is 200
    And the channel has slug "general"

  Scenario: Non-organizer cannot create channels
    Given I am logged in as a member
    When I create a channel with slug "hacker" and name "Hackers"
    Then the response status is 403
