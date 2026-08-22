# Agent Profile

> An open standard for portable agent profiles.

**Status:** Working Draft  
**Version:** 0.0.1

Agent Profile is an open, vendor-neutral standard for a portable directory package describing one durable logical AI agent. A profile can name an owner, list contact methods, associate external identifiers, and bundle Agent Plugins.

## What a profile describes

- **Identity:** A permanent absolute URI identifies one durable logical agent, not a process, installation, runtime, or session.
- **Owner:** Optional public metadata names the human or organization responsible for the agent. It does not grant authority.
- **Contacts:** Optional URI values can describe email, SMS, telephone, or other ways to contact the agent.
- **External identifiers:** Optional issuer-and-subject or URI identifiers associate the profile with identities used by other systems.
- **Agent Plugins:** A profile package may include portable capabilities under its `plugins` directory. Agent Plugins remains authoritative for each plugin's contents.

## Trust boundary

Profile values are metadata claims, not credentials or proof. Agent Profile does not verify its claims, authenticate an agent, authorize an action, or enforce policy. Systems can reference profile metadata when building human oversight, auditing, governance, provenance, and accountability, but the profile does not provide those controls by itself.

## Resources

- [Specification 0.0.1](https://github.com/agent-profile/agent-profile-spec/blob/6e56a3c3e1e8684d1b280374a92d4801dababb03/spec/0.0.1.md)
- [JSON Schema 0.0.1](https://agentprofile.org/schemas/0.0.1/profile.schema.json)
- [Specification repository](https://github.com/agent-profile/agent-profile-spec)
- [Website repository](https://github.com/agent-profile/agent-profile-site)

Specification prose, website content, and documentation are available under CC BY 4.0. Schemas, source code, and conformance material are available under Apache 2.0.
